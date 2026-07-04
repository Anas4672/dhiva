'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API call for password recovery
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 z-10">
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-sky-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Link Sent</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              If an account exists for <strong>{email}</strong>, we have sent a simulated password recovery email.
            </p>
            <p className="text-xs text-indigo-500/70 font-mono bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/10">
              Note: SMTP mail configuration is ready. In local testing, you can sign in using seeded passwords or register a new email.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                Reset Password
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your email to receive a password reset link
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
