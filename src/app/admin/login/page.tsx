'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('Invalid admin credentials.');
        setLoading(false);
      } else {
        // Authenticated successfully. Now check role.
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();

        if (session?.user?.role !== 'ADMIN') {
          // Force sign out since they are not an Admin
          await signOut({ redirect: false });
          setError('Access Denied. This panel is restricted to Administrators only.');
          setLoading(false);
        } else {
          router.push('/admin/dashboard');
          router.refresh();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-900 relative overflow-hidden">
      {/* Background blobs for admin dark theme */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card border-slate-800 bg-slate-950/70 rounded-3xl p-8 z-10 text-white">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
            Admin Console
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access platform controls
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Admin Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
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
                placeholder="admin@dhivacourse.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
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
                className="w-full pl-10 pr-10 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In to Console
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
