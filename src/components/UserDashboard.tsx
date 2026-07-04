'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateUserProfile, markNotificationAsRead } from '@/app/actions';
import {
  BookOpen,
  User,
  Bell,
  MessageSquare,
  Lock,
  Loader2,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnailUrl: string;
  instructorName: string;
  level: string;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  firstLessonId?: string;
}

interface UserNotification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface UserMessage {
  id: string;
  subject: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: Date;
}

interface UserDashboardProps {
  user: {
    name: string;
    email: string;
  };
  courses: EnrolledCourse[];
  notifications: UserNotification[];
  messages: UserMessage[];
}

export default function UserDashboard({ user, courses, notifications: initialNotifications, messages }: UserDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('courses');
  const [notifications, setNotifications] = useState(initialNotifications);

  // Profile forms state
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    currentPassword: '',
    newPassword: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Handle URL tab search parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['courses', 'notifications', 'messages', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    const res = await updateUserProfile(profileData);
    setProfileLoading(false);

    if (res.error) {
      setProfileError(res.error);
    } else {
      setProfileSuccess('Profile details updated successfully!');
      setProfileData({ ...profileData, currentPassword: '', newPassword: '' });
      router.refresh();
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 glass-card rounded-3xl p-6 h-fit space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md">
            {user.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{user.name}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Enrolled Courses
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              Notifications
            </span>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="h-5 min-w-5 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center px-1.5 animate-pulse">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Support Queries
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
            }`}
          >
            <User className="w-4 h-4" />
            Profile Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 glass-card rounded-3xl p-8 bg-white dark:bg-slate-900 shadow-md">
        
        {/* TAB 1: Enrolled Courses */}
        {activeTab === 'courses' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Courses</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Resume learning where you left off.</p>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-md font-bold text-slate-800 dark:text-white mb-2">No Enrolled Courses</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                  You are not currently enrolled in any course. Once you make a payment and it is approved, courses will show here.
                </p>
                <Link
                  href="/"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                      <img src={course.thumbnailUrl} alt={course.title} className="object-cover w-full h-full" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-[8px] font-bold text-white tracking-widest uppercase">
                        {course.level}
                      </span>
                    </div>

                    <div className="p-4 space-y-4 flex-grow flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                          {course.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Instructor: {course.instructorName}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>PROGRESS</span>
                          <span>{Math.round(course.progressPercent)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${course.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] text-slate-400 block pt-0.5">
                          {course.completedLessonsCount} / {course.totalLessonsCount} Topics Completed
                        </span>
                      </div>

                      <Link
                        href={course.firstLessonId ? `/courses/${course.id}/lessons/${course.firstLessonId}` : `/courses/${course.id}`}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                      >
                        Resume Learning
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Notifications</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Recent updates regarding your account or course access.</p>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      n.isRead
                        ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 text-slate-500'
                        : 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/20 dark:border-indigo-900/30 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 opacity-80" style={{ visibility: n.isRead ? 'hidden' : 'visible' }}></div>
                    <div className="flex-grow space-y-1">
                      <p className="text-xs leading-relaxed font-semibold">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-sky-400 hover:underline hover:cursor-pointer shrink-0"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Messages / Queries */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Support Queries</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Track and view responses to your support inquiries.</p>
              </div>
              <Link
                href="/contact"
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase rounded-xl transition-all shrink-0 hover:bg-indigo-600 hover:text-white cursor-pointer"
              >
                Submit New Ticket
              </Link>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">You haven't submitted any support queries yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-900 pb-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{msg.subject}</h4>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Submitted on {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                          msg.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        }`}
                      >
                        {msg.status === 'PENDING' ? 'PENDING REPLY' : 'ANSWERED'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-900">
                      <span className="font-bold text-[10px] text-slate-400 block mb-1">YOUR MESSAGE:</span>
                      {msg.message}
                    </div>

                    {msg.reply && (
                      <div className="text-xs text-indigo-700 dark:text-sky-300 leading-relaxed font-semibold bg-indigo-50/20 dark:bg-indigo-950/10 p-3.5 rounded-xl border border-indigo-100/10">
                        <span className="font-bold text-[10px] text-indigo-400 block mb-1">ADMIN REPLY:</span>
                        {msg.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Edit your user details and change your account password.</p>
            </div>

            {profileError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={profileLoading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={profileLoading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wider">Change Password (Optional)</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  To change your password, fill in both fields below. Otherwise, leave them blank to keep your current password.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      disabled={profileLoading}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      disabled={profileLoading}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow-indigo-500/10 flex items-center justify-center gap-1.5 transition-all mt-6 cursor-pointer"
              >
                {profileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Save Profile Settings
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
