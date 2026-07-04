import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import { redirect } from 'next/navigation';
import UserDashboard from '@/components/UserDashboard';

export const revalidate = 0; // Dynamic route

export default async function DashboardPage() {
  // 1. Verify Authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // 2. Fetch Enrolled Courses with progress tracking
  let enrolledCoursesList: any[] = [];
  let notifications: any[] = [];
  let messages: any[] = [];
  let dbFailed = false;

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    enrolledCoursesList = await Promise.all(
      enrollments.map(async (enr) => {
        const course = enr.course;

        // Flatten lessons to calculate total and retrieve progress
        const lessons = course.modules.flatMap((m) => m.lessons);
        const totalLessonsCount = lessons.length;

        let completedLessonsCount = 0;
        if (totalLessonsCount > 0) {
          const completedProgress = await prisma.lessonProgress.findMany({
            where: {
              userId,
              lessonId: { in: lessons.map((l) => l.id) },
              completed: true,
            },
          });
          completedLessonsCount = completedProgress.length;
        }

        const progressPercent =
          totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0;

        // Identify first lesson ID to start/resume learning
        const firstLessonId = course.modules[0]?.lessons[0]?.id;

        return {
          id: course.id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          instructorName: course.instructorName,
          level: course.level,
          progressPercent,
          completedLessonsCount,
          totalLessonsCount,
          firstLessonId,
        };
      })
    );
  } catch (error) {
    console.warn('Database query failed for dashboard courses, falling back to mockDb:', error);
    dbFailed = true;
  }

  if (dbFailed) {
    // Populate from mockDb
    const mockEnrollments = mockDb.enrollments.filter((e) => e.userId === userId);
    enrolledCoursesList = mockEnrollments
      .map((enr) => {
        const course = mockDb.courses.find((c) => c.id === enr.courseId);
        if (!course) return null;

        const modules = mockDb.modules.filter((m) => m.courseId === course.id);
        const lessons = mockDb.lessons.filter((l) => modules.some((m) => m.id === l.moduleId));
        const totalLessonsCount = lessons.length;

        const completedProgress = mockDb.lessonProgress.filter(
          (p) => p.userId === userId && lessons.some((l) => l.id === p.lessonId) && p.completed
        );
        const completedLessonsCount = completedProgress.length;

        const progressPercent =
          totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0;

        const firstModule = modules.sort((a, b) => a.order - b.order)[0];
        const firstLesson = firstModule
          ? mockDb.lessons.filter((l) => l.moduleId === firstModule.id).sort((a, b) => a.order - b.order)[0]
          : null;
        const firstLessonId = firstLesson?.id;

        return {
          id: course.id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          instructorName: course.instructorName,
          level: course.level,
          progressPercent,
          completedLessonsCount,
          totalLessonsCount,
          firstLessonId,
        };
      })
      .filter(Boolean);
  }

  // 3. Fetch User Notifications
  if (dbFailed) {
    notifications = mockDb.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    try {
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30, // Cap at 30 recent notifications
      });
    } catch (error) {
      console.warn('Database query failed for notifications, falling back to mockDb:', error);
      notifications = mockDb.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  // 4. Fetch User Support Tickets (matched by user's session email)
  if (dbFailed) {
    messages = mockDb.messages
      .filter((m) => m.email.toLowerCase() === session.user.email?.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    try {
      messages = await prisma.message.findMany({
        where: { email: session.user.email || '' },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.warn('Database query failed for messages, falling back to mockDb:', error);
      messages = mockDb.messages
        .filter((m) => m.email.toLowerCase() === session.user.email?.toLowerCase())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Student Dashboard
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Manage your courses, view announcements, edit settings, and connect with help resources.
          </p>
        </div>

        <UserDashboard
          user={{
            name: session.user.name || 'Student',
            email: session.user.email || '',
          }}
          courses={enrolledCoursesList}
          notifications={notifications}
          messages={messages}
        />
      </div>
    </div>
  );
}
