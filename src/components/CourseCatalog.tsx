'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Clock, User, Award, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  instructorName: string;
  instructorBio: string | null;
  instructorAvatar: string | null;
  duration: string;
  level: string;
}

interface CourseCatalogProps {
  initialCourses: Course[];
}

export default function CourseCatalog({ initialCourses }: CourseCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  const filteredCourses = initialCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      selectedLevel === 'ALL' || course.level.toUpperCase() === selectedLevel.toUpperCase();

    return matchesSearch && matchesLevel;
  });

  const levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search courses, instructors, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all"
          />
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Courses Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search criteria or select a different filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600&auto=format&fit=crop'}
                  alt={course.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {course.level}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{course.instructorName}</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">LIFETIME ACCESS</span>
                    <span className="text-lg font-extrabold text-indigo-600 dark:text-sky-400">
                      ₹{course.price.toLocaleString()}
                    </span>
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    View Course
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
