import React from 'react';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import CourseCatalog from '@/components/CourseCatalog';
import Link from 'next/link';
import { Award, ShieldAlert, Zap, MessageSquare, PhoneCall, CheckCircle } from 'lucide-react';

export const revalidate = 0; // Dynamic route

export default async function HomePage() {
  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (courses.length === 0) {
      courses = mockDb.courses;
    }
  } catch (error) {
    console.warn('Failed to load courses from DB (database might be offline):', error);
    courses = mockDb.courses;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/30 dark:text-indigo-400">
            <Zap className="w-3.5 h-3.5" />
            Empower Your Programming Journey
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-4xl mx-auto">
            Learn Production-Ready{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-sky-300">
              Full-Stack Engineering
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            High-definition video courses, source code materials, downloadable PDF summaries, and a direct 1-on-1 support line to guide you through real-world deployment challenges.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="#catalog"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all text-sm"
            >
              Explore Courses
            </a>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-2xl transition-all text-sm"
            >
              Speak to Instructor
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <div>
            <span className="block text-3xl font-black text-indigo-600 dark:text-sky-400">100%</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Manual Verification</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-indigo-600 dark:text-sky-400">6x6</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Module Structure</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-indigo-600 dark:text-sky-400">₹0</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gateway Fees</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-indigo-600 dark:text-sky-400">24/7</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">WhatsApp Support</span>
          </div>
        </div>
      </section>

      {/* 3. Platform Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why Learn on DhivaCourse?</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">We build software to provide the safest, most efficient learning platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Complete Course Structure</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Every course is divided into exactly 6 comprehensive modules, each comprising 6 dedicated lessons with HD video playback, source codes, and notes.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1-on-1 Support</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Facing bugs or deployment blockers? Get direct support from the instructor via WhatsApp (+91 9894112566) or Telegram immediately.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Watermarked Security</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Our advanced copy protection locks right-clicking, text copying, page source requests, and overlays dynamic watermarks for intellectual safety.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Course Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-10">
        <div className="text-center md:text-left mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Our Course Catalog</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose your track, scan the UPI code, submit your screenshot, and start learning as soon as the admin approves.
          </p>
        </div>

        <CourseCatalog initialCourses={courses} />
      </section>

      {/* 5. Direct Connect Support Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-3xl p-8 md:p-12 shadow-xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Have any questions before joining?</h2>
              <p className="text-indigo-200 text-sm max-w-xl">
                Chat with the instructor directly. Get advice on which course to take, course outcomes, or clarify manual UPI payment steps.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold pt-2 text-indigo-100">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-400" /> Phone: 9894112566</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-400" /> Instagram: dhiva__28</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-400" /> WhatsApp: 9894112566</span>
              </div>
            </div>
            <a
              href="https://wa.me/919894112566"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-emerald-500/10 transition-all text-sm w-full md:w-auto justify-center"
            >
              <PhoneCall className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
