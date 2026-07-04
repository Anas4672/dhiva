import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import { redirect, notFound } from 'next/navigation';
import LessonClient from '@/components/LessonClient';

export const revalidate = 0; // Dynamic route

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  // 1. Verify Session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session.user.id;
  const resolvedParams = await params;
  const courseId = resolvedParams.id;
  const lessonId = resolvedParams.lessonId;

  // 2. Verify Course Access (Enrollment)
  let enrollment = null;
  let dbFailed = false;

  try {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
  } catch (error) {
    console.warn('Database query failed for lesson access verification, falling back to mockDb:', error);
    dbFailed = true;
    enrollment = mockDb.enrollments.find((e) => e.userId === userId && e.courseId === courseId) || null;
  }

  // Admin always has bypass access. Regular users must have active enrollment.
  const isAdmin = session.user.role === 'ADMIN';
  if (!enrollment && !isAdmin) {
    redirect(`/courses/${courseId}`);
  }

  // 3. Fetch Course Syllabus details
  let course: any = null;
  if (dbFailed) {
    const mockCourse = mockDb.courses.find((c) => c.id === courseId);
    if (mockCourse) {
      const modules = mockDb.modules
        .filter((m) => m.courseId === courseId)
        .map((m) => ({
          ...m,
          lessons: mockDb.lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.order - b.order);
      course = {
        ...mockCourse,
        modules,
      };
    }
  } else {
    try {
      course = await prisma.course.findUnique({
        where: { id: courseId },
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
      });
    } catch (error) {
      console.warn('Database query failed for course syllabus, falling back to mockDb:', error);
      const mockCourse = mockDb.courses.find((c) => c.id === courseId);
      if (mockCourse) {
        const modules = mockDb.modules
          .filter((m) => m.courseId === courseId)
          .map((m) => ({
            ...m,
            lessons: mockDb.lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order),
          }))
          .sort((a, b) => a.order - b.order);
        course = {
          ...mockCourse,
          modules,
        };
      }
    }
  }

  if (!course) {
    notFound();
  }

  // 4. Fetch Active Lesson detail
  let currentLesson = null;
  if (dbFailed) {
    currentLesson = mockDb.lessons.find((l) => l.id === lessonId) || null;
  } else {
    try {
      currentLesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });
    } catch (error) {
      console.warn('Database query failed for lesson detail, falling back to mockDb:', error);
      currentLesson = mockDb.lessons.find((l) => l.id === lessonId) || null;
    }
  }

  if (!currentLesson || currentLesson.moduleId === null) {
    notFound();
  }

  // 5. Fetch Lesson progress completion flag
  let isCompleted = false;
  if (dbFailed) {
    isCompleted = mockDb.lessonProgress.some((p) => p.userId === userId && p.lessonId === lessonId && p.completed);
  } else {
    try {
      const progressRecord = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: { userId, lessonId },
        },
      });
      isCompleted = progressRecord?.completed || false;
    } catch (error) {
      console.warn('Database query failed for lesson progress, falling back to mockDb:', error);
      isCompleted = mockDb.lessonProgress.some((p) => p.userId === userId && p.lessonId === lessonId && p.completed);
    }
  }

  return (
    <LessonClient
      courseId={course.id}
      courseTitle={course.title}
      modules={course.modules}
      currentLesson={currentLesson}
      user={{
        name: session.user.name || 'Student',
        email: session.user.email || '',
      }}
      initialCompleted={isCompleted}
    />
  );
}
