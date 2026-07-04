'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ContentProtector from '@/components/ContentProtector';
import Watermark from '@/components/Watermark';
import { toggleLessonProgress } from '@/app/actions';
import {
  Play,
  Lock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileDown,
  BookOpen,
  CheckSquare,
  Square,
  Menu,
  X,
  Loader2,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  notes: string | null;
  pdfUrl: string | null;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface LessonClientProps {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  currentLesson: Lesson;
  user: {
    name: string;
    email: string;
  };
  initialCompleted: boolean;
}

export default function LessonClient({
  courseId,
  courseTitle,
  modules,
  currentLesson,
  user,
  initialCompleted,
}: LessonClientProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle progress completion
  const handleToggleComplete = async () => {
    setLoading(true);
    const newCompletedState = !completed;
    const res = await toggleLessonProgress(currentLesson.id, newCompletedState);
    setLoading(false);

    if (res.success) {
      setCompleted(newCompletedState);
      router.refresh();
    }
  };

  // Find next/prev lessons for footer buttons
  const allLessons = modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = allLessons[currentIndex - 1];
  const nextLesson = allLessons[currentIndex + 1];

  return (
    <ContentProtector active={true}>
      <div className="min-h-[85vh] bg-slate-900 text-slate-100 flex flex-col md:flex-row relative">
        
        {/* Dynamic Watermark Overlay */}
        <Watermark name={user.name} email={user.email} />

        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center z-30">
          <span className="text-xs font-bold truncate max-w-[200px]">{currentLesson.title}</span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Curriculum Sidebar */}
        <aside
          className={`w-full md:w-80 bg-slate-950 border-r border-slate-850 shrink-0 md:block z-30 ${
            sidebarOpen ? 'block absolute inset-y-0 left-0 h-full md:relative' : 'hidden'
          }`}
        >
          <div className="p-4 border-b border-slate-850 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-200 line-clamp-1">{courseTitle}</h3>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">CURRICULUM</span>
            </div>
            <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(85vh-60px)] p-4 space-y-4">
            {modules.map((mod) => (
              <div key={mod.id} className="space-y-2">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{mod.title}</h4>
                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLesson.id;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${courseId}/lessons/${lesson.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                          isCurrent
                            ? 'bg-indigo-600/25 border border-indigo-500 text-white font-bold'
                            : 'text-slate-400 hover:bg-slate-900 border border-transparent hover:text-slate-200'
                        }`}
                      >
                        <Play className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-indigo-400 fill-indigo-400' : 'text-slate-500'}`} />
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main learning screen */}
        <main className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto h-[85vh] z-10 relative">
          {/* Video Player */}
          {currentLesson.videoUrl ? (
            <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl">
              {currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={currentLesson.videoUrl}
                  title={currentLesson.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  src={currentLesson.videoUrl}
                  controls
                  controlsList="nodownload"
                  className="absolute inset-0 w-full h-full"
                ></video>
              )}
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-slate-850 text-slate-500">
              <BookOpen className="w-12 h-12 mb-2 text-slate-700" />
              <p className="text-xs">No video lecture attached to this topic.</p>
            </div>
          )}

          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentLesson.title}</h1>
              <p className="text-xs text-slate-400 mt-1">Course: {courseTitle}</p>
            </div>

            {/* Checkbox Complete */}
            <button
              onClick={handleToggleComplete}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                completed
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : completed ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Completed
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Mark as Done
                </>
              )}
            </button>
          </div>

          {/* Notes and Downloadable PDF resource */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Notes */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest">Lecture Notes</h3>
              {currentLesson.notes ? (
                <div
                  className="prose prose-sm prose-invert max-w-none text-slate-350 leading-relaxed font-medium bg-slate-950 p-6 rounded-2xl border border-slate-850"
                  dangerouslySetInnerHTML={{ __html: currentLesson.notes }}
                />
              ) : (
                <p className="text-xs text-slate-500">No lecture notes provided for this topic.</p>
              )}
            </div>

            {/* Downloads */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest">Study Material</h3>
              {currentLesson.pdfUrl ? (
                <a
                  href={currentLesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-2xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Download PDF Material</span>
                      <span className="text-[10px] text-slate-400 font-mono">Reference Notes</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <p className="text-xs text-slate-500">No downloadable PDF attached.</p>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-850 mt-6">
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="flex items-center gap-1 bg-slate-850 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Topic
              </Link>
            ) : (
              <div></div>
            )}
            
            {nextLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                Next Topic
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </main>
      </div>
    </ContentProtector>
  );
}
