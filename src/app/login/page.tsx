'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('/dashboard');

  useEffect(() => {
    const url = searchParams.get('callbackUrl');
    if (url) {
      setCallbackUrl(url);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      });

      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        // Successful login
        // Check session to route admin or user correctly
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card rounded-3xl p-8 z-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign in to access your course panel
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail className="w-5 h-5" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={loading}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-indigo-600 dark:text-sky-400 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              disabled={loading}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all mt-6"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 dark:text-sky-400 hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md glass-card rounded-3xl p-8 z-10 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
