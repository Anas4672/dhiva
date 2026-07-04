import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { getAdminStats } from '@/app/actions';

export const revalidate = 0; // Dynamic route

export default async function AdminDashboardPage() {
  // 1. Verify Administration Session
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  // 2. Fetch Dashboard aggregated statistics
  let stats = {
    totalUsers: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    totalRevenue: 0,
    pendingPaymentsCount: 0,
    pendingMessagesCount: 0,
  };
  let dbFailed = false;

  try {
    stats = await getAdminStats();
  } catch (error) {
    console.warn('Database query failed for admin stats, falling back to mockDb:', error);
    dbFailed = true;
  }

  // 3. Fetch all courses with full syllabi details (modules & lessons)
  let courses: any[] = [];
  if (dbFailed) {
    courses = mockDb.courses.map((c) => {
      const modules = mockDb.modules
        .filter((m) => m.courseId === c.id)
        .map((m) => ({
          ...m,
          lessons: mockDb.lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.order - b.order);
      return {
        ...c,
        modules,
      };
    });
  } else {
    try {
      courses = await prisma.course.findMany({
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
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.warn('Database query failed for admin courses, falling back to mockDb:', error);
      dbFailed = true;
      courses = mockDb.courses.map((c) => {
        const modules = mockDb.modules
          .filter((m) => m.courseId === c.id)
          .map((m) => ({
            ...m,
            lessons: mockDb.lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order),
          }))
          .sort((a, b) => a.order - b.order);
        return {
          ...c,
          modules,
        };
      });
    }
  }

  // 4. Fetch all manual payment requests
  let payments: any[] = [];
  if (dbFailed) {
    payments = mockDb.paymentRequests
      .map((r) => {
        const user = mockDb.users.find((u) => u.id === r.userId);
        const course = mockDb.courses.find((c) => c.id === r.courseId);
        return {
          ...r,
          user: user ? { name: user.name, email: user.email } : { name: 'Unknown', email: 'unknown@dhivacourse.com' },
          course: course ? { title: course.title } : { title: 'Unknown Course' },
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    try {
      payments = await prisma.paymentRequest.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.warn('Database query failed for admin payments, falling back to mockDb:', error);
      payments = mockDb.paymentRequests
        .map((r) => {
          const user = mockDb.users.find((u) => u.id === r.userId);
          const course = mockDb.courses.find((c) => c.id === r.courseId);
          return {
            ...r,
            user: user ? { name: user.name, email: user.email } : { name: 'Unknown', email: 'unknown@dhivacourse.com' },
            course: course ? { title: course.title } : { title: 'Unknown Course' },
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  // 5. Fetch all support enquiries
  let messages: any[] = [];
  if (dbFailed) {
    messages = [...mockDb.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    try {
      messages = await prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.warn('Database query failed for admin messages, falling back to mockDb:', error);
      messages = [...mockDb.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  // 6. Fetch all students (role USER) with enrollments for overrides
  let users: any[] = [];
  if (dbFailed) {
    users = mockDb.users
      .filter((u) => u.role === 'USER')
      .map((u) => {
        const userEnrollments = mockDb.enrollments.filter((e) => e.userId === u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          enrollments: userEnrollments.map((e) => ({ courseId: e.courseId })),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    try {
      users = await prisma.user.findMany({
        where: { role: 'USER' },
        select: {
          id: true,
          name: true,
          email: true,
          enrollments: {
            select: {
              courseId: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.warn('Database query failed for admin user override checks, falling back to mockDb:', error);
      users = mockDb.users
        .filter((u) => u.role === 'USER')
        .map((u) => {
          const userEnrollments = mockDb.enrollments.filter((e) => e.userId === u.id);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            enrollments: userEnrollments.map((e) => ({ courseId: e.courseId })),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // 7. Fetch active contact / UPI coordinates
  let contact = null;
  if (dbFailed) {
    contact = mockDb.contactDetails;
  } else {
    try {
      contact = await prisma.contactDetails.findUnique({
        where: { id: 'static' },
      });
    } catch (error) {
      console.warn('Database query failed for admin settings, falling back to mockDb:', error);
      contact = mockDb.contactDetails;
    }
  }

  if (!contact) {
    // Return standard defaults if seed hasn't run or table is empty
    contact = {
      id: 'static',
      phone: '9894112566',
      whatsapp: '9894112566',
      email: 'dhiva2jeeva@gmail.com',
      telegram: '',
      instagram: 'dhiva__28',
      youtube: '',
      facebook: '',
      upiId: '9894112566@ybl',
      upiQrCode: '/qr_code.png',
      updatedAt: new Date(),
    };
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Admin Management Console
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
            Create courses, approve student payment proof screenshots, override course access, broadcast announcements, and update settings.
          </p>
        </div>

        <AdminDashboard
          stats={stats}
          courses={courses}
          payments={payments as any}
          messages={messages as any}
          users={users}
          contactSettings={contact}
        />
      </div>
    </div>
  );
}
