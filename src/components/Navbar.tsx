'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User as UserIcon, BookOpen, Settings, LogOut, Sun, Moon, Bell } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Toggle Theme
  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains('dark');
    setIsDark(initialTheme);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Fetch unread notifications for users
  useEffect(() => {
    if (session?.user && session.user.role === 'USER') {
      fetch('/api/user/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            setNotifications(data.notifications.filter((n: any) => !n.isRead));
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-card-border navbar-bg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-all">
                D
              </span>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-sky-300">
                DhivaCourse
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors font-medium"
            >
              Browse Courses
            </Link>
            <Link
              href="/contact"
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors font-medium"
            >
              Contact Us
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* Notification bell for normal user */}
            {session?.user && session.user.role === 'USER' && (
              <Link href="/dashboard?tab=notifications" className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </Link>
            )}

            {/* Session Auth state */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-medium text-sm text-slate-700 dark:text-slate-200"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
                    {session.user.name?.[0].toUpperCase() || 'U'}
                  </div>
                  <span>{session.user.name}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl py-2 z-50">
                    {session.user.role === 'ADMIN' ? (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-indigo-500" />
                          Admin Console
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                          My Learning
                        </Link>
                        <Link
                          href="/dashboard?tab=profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-indigo-500" />
                          Edit Profile
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-card-border bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            All Courses
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Contact Us
          </Link>

          {session ? (
            <>
              {session.user.role === 'ADMIN' ? (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-indigo-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Admin Console
                </Link>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    My Learning
                  </Link>
                  <Link
                    href="/dashboard?tab=profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Profile Settings
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2 rounded-xl text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
