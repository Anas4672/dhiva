import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10" />
      </div>
      
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        Access Restricted
      </h1>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
        You do not have the required administrative permissions to access this page. If you are an administrator, please sign in with your admin credentials.
      </p>

      <div className="flex gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Home className="w-4 h-4" /> Go to Home
        </Link>
        <Link
          href="/admin/login"
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
}
