import React from 'react';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import CheckoutForm from '@/components/CheckoutForm';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, Lock } from 'lucide-react';

export const revalidate = 0; // Dynamic route

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  // 1. Verify Authentication
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const courseId = resolvedParams.id;

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=/courses/${courseId}/checkout`);
  }

  // 2. Fetch Course Details
  let course: any = null;
  let dbFailed = false;
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
      },
    });
  } catch (error) {
    console.warn('Database query failed for checkout course details, falling back to mockDb:', error);
    dbFailed = true;
    const mockCourse = mockDb.courses.find((c) => c.id === courseId);
    if (mockCourse) {
      course = {
        id: mockCourse.id,
        title: mockCourse.title,
        price: mockCourse.price,
      };
    }
  }

  if (!course) {
    notFound();
  }

  // 3. Check if already Enrolled
  let isEnrolled = false;
  if (dbFailed) {
    isEnrolled = mockDb.enrollments.some((e) => e.userId === session.user.id && e.courseId === course.id);
  } else {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          },
        },
      });
      isEnrolled = !!enrollment;
    } catch (error) {
      console.warn('Database query failed for checkout enrollment check, falling back to mockDb:', error);
      isEnrolled = mockDb.enrollments.some((e) => e.userId === session.user.id && e.courseId === course.id);
    }
  }

  if (isEnrolled) {
    redirect(`/courses/${course.id}`);
  }

  // 4. Fetch Active Admin Contact/UPI coordinates
  let contact = null;
  if (dbFailed) {
    contact = mockDb.contactDetails;
  } else {
    try {
      contact = await prisma.contactDetails.findUnique({
        where: { id: 'static' },
      });
    } catch (error) {
      console.warn('Failed to load contact info (using fallback defaults):', error);
      contact = mockDb.contactDetails;
    }
  }

  const upiId = contact?.upiId || '9894112566@ybl';
  const upiQrCode = contact?.upiQrCode || null;

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-8">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Courses</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/courses/${course.id}`} className="hover:text-indigo-600 transition-colors truncate max-w-xs">{course.title}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 dark:text-slate-300">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-8 space-y-6 bg-white dark:bg-slate-900 shadow-md">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Secure Checkout</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are purchasing lifetime access to <strong className="text-slate-700 dark:text-slate-300">{course.title}</strong>. Please complete the UPI payment details below.
              </p>
            </div>

            <CheckoutForm
              course={course}
              contact={{ upiId, upiQrCode }}
            />
          </div>

          {/* Sidebar Invoice Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Summary</h3>

              <div className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span>Course Price</span>
                  <span className="text-slate-700 dark:text-slate-300">₹{course.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gateway Processing Fee</span>
                  <span className="text-emerald-500">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (GST)</span>
                  <span className="text-emerald-500">₹0 (INCLUDED)</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Total Amount</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-sky-400">₹{course.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Shield Info */}
            <div className="glass-card rounded-3xl p-6 bg-indigo-600/5 dark:bg-indigo-500/5 border-indigo-500/10 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                Manual Auditing Active
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                We manually check the UPI Transaction ID against our bank statement. Any fraudulent submission of transaction IDs or fake screenshots will result in immediate and permanent account suspension without warning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
