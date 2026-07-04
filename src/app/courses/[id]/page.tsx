import React from 'react';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  User,
  Award,
  Lock,
  PlayCircle,
  HelpCircle,
  FileText,
  Video,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Dynamic route

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;

  // 1. Fetch Course details with syllabus
  let course: any = null;
  let dbFailed = false;

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
    console.warn('Database query failed for course details, falling back to mockDb:', error);
    dbFailed = true;
  }

  if (dbFailed || !course) {
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

  if (!course) {
    notFound();
  }

  // 2. Check Auth and Enrollment Status
  const session = await getServerSession(authOptions);
  let isEnrolled = false;
  let hasPendingRequest = false;
  let hasRejectedRequest = false;
  let rejectionReason = '';

  if (session?.user) {
    const userId = session.user.id;

    if (dbFailed) {
      const isMockEnrolled = mockDb.enrollments.some((e) => e.userId === userId && e.courseId === courseId);
      if (isMockEnrolled) {
        isEnrolled = true;
      } else {
        const req = mockDb.paymentRequests
          .filter((r) => r.userId === userId && r.courseId === courseId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        if (req) {
          if (req.status === 'PENDING') {
            hasPendingRequest = true;
          } else if (req.status === 'REJECTED') {
            hasRejectedRequest = true;
            rejectionReason = req.rejectionReason || '';
          }
        }
      }
    } else {
      try {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: { userId, courseId },
          },
        });

        if (enrollment) {
          isEnrolled = true;
        } else {
          // Check payment request
          const paymentRequest = await prisma.paymentRequest.findFirst({
            where: { userId, courseId },
            orderBy: { createdAt: 'desc' },
          });

          if (paymentRequest) {
            if (paymentRequest.status === 'PENDING') {
              hasPendingRequest = true;
            } else if (paymentRequest.status === 'REJECTED') {
              hasRejectedRequest = true;
              rejectionReason = paymentRequest.rejectionReason || '';
            }
          }
        }
      } catch (error) {
        console.warn('Database query failed for course enrollment check, falling back to mockDb:', error);
        const isMockEnrolled = mockDb.enrollments.some((e) => e.userId === userId && e.courseId === courseId);
        if (isMockEnrolled) {
          isEnrolled = true;
        } else {
          const req = mockDb.paymentRequests
            .filter((r) => r.userId === userId && r.courseId === courseId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
          if (req) {
            if (req.status === 'PENDING') {
              hasPendingRequest = true;
            } else if (req.status === 'REJECTED') {
              hasRejectedRequest = true;
              rejectionReason = req.rejectionReason || '';
            }
          }
        }
      }
    }
  }

  // Get first lesson ID if exists, to route "Start Learning"
  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Courses</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs">{course.title}</span>
        </div>

        {/* Hero Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Main Info */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                {course.level} LEVEL
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {course.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-100 dark:border-slate-800 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">DURATION</span>
                  <span>{course.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SYLLABUS</span>
                  <span>{course.modules.length} Modules</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">INSTRUCTOR</span>
                  <span>{course.instructorName}</span>
                </div>
              </div>
            </div>

            {/* Instructor Details */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <img
                src={course.instructorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'}
                alt={course.instructorName}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Instructed by {course.instructorName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{course.instructorBio || 'Industry expert in web application engineering.'}</p>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="lg:col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-md">
            <div className="space-y-6">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-150 dark:border-slate-800">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">LIFETIME COURSE ACCESS</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">₹{course.price.toLocaleString()}</span>
                  <span className="text-sm text-slate-400 line-through">₹{(course.price * 1.5).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Full HD videos & codes included</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Verified manual UPI payments</div>
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Secure watermark protected pages</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              {isEnrolled ? (
                <Link
                  href={firstLessonId ? `/courses/${courseId}/lessons/${firstLessonId}` : '#'}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-lg transition-all text-sm"
                >
                  Start Learning
                  <PlayCircle className="w-4 h-4" />
                </Link>
              ) : hasPendingRequest ? (
                <div className="space-y-3">
                  <div className="w-full py-3 px-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-2xl text-center text-xs font-semibold leading-relaxed">
                    Payment proof pending admin manual verification.
                  </div>
                  <Link
                    href="/dashboard"
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl flex items-center justify-center gap-1 transition-all text-xs"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {hasRejectedRequest && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 rounded-xl text-center text-xs">
                      <span className="font-bold block mb-0.5">Previous Payment Rejected</span>
                      {rejectionReason || 'Details incorrect.'}
                    </div>
                  )}
                  <Link
                    href={`/courses/${courseId}/checkout`}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-1 shadow-lg transition-all text-sm"
                  >
                    Enroll Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Syllabus Section */}
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Course Syllabus</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">Each course offers exactly 6 modules containing 6 specialized topics.</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {course.modules.map((mod: any) => (
              <div
                key={mod.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {mod.title}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 tracking-wider">
                    {mod.lessons.length} LESSONS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mod.lessons.map((lesson: any) => {
                    const lessonHref = isEnrolled
                      ? `/courses/${courseId}/lessons/${lesson.id}`
                      : `/courses/${courseId}/checkout`;

                    return (
                      <Link
                        key={lesson.id}
                        href={lessonHref}
                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-950/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-900 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                            {isEnrolled ? (
                              <Video className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                              {lesson.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1 mt-0.5">
                              <FileText className="w-3 h-3 text-slate-400" /> Video & PDF Notes
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors pl-2">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
