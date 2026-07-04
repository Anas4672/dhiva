import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageSquare, Shield } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-black text-lg">
                D
              </span>
              <span className="text-lg font-bold text-white tracking-tight">
                DhivaCourse
              </span>
            </div>
            <p className="text-sm text-slate-400">
              A high-end, premium Learning Management System tailored for mastering modern full-stack engineering and development workflows.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" />
                <a href="tel:+919894112566" className="hover:text-white transition-colors">
                  +91 9894112566
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <a
                  href="https://wa.me/919894112566"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <a href="mailto:dhiva2jeeva@gmail.com" className="hover:text-white transition-colors">
                  dhiva2jeeva@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <InstagramIcon className="w-4 h-4 text-pink-400" />
                <a
                  href="https://instagram.com/dhiva__28"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @dhiva__28
                </a>
              </li>
            </ul>
          </div>

          {/* Security details */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Content Protection</h3>
            <p className="text-xs text-slate-500 mb-3">
              We employ watermark systems and copy-protection layers to safeguard proprietary instructional files. Unauthorized sharing or capturing is prohibited.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
              <Shield className="w-4 h-4 text-indigo-400" />
              Secure JWT Session Protected
            </div>
          </div>
        </div>

        <hr className="my-8 border-slate-800" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} DhivaCourse. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors font-medium">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
