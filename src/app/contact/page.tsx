import React from 'react';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import ContactForm from '@/components/ContactForm';
import { Phone, Mail, MessageSquare, Compass, Send } from 'lucide-react';

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

export const revalidate = 0; // Dynamic route

export default async function ContactPage() {
  // Fetch active contact details from database
  let contact = null;
  try {
    contact = await prisma.contactDetails.findUnique({
      where: { id: 'static' },
    });
  } catch (error) {
    console.warn('Failed to fetch contact details from database (using fallback defaults):', error);
  }

  contact = contact || mockDb.contactDetails;

  // Fallback defaults
  const phone = contact?.phone || '9894112566';
  const whatsapp = contact?.whatsapp || '9894112566';
  const email = contact?.email || 'dhiva2jeeva@gmail.com';
  const instagram = contact?.instagram || 'dhiva__28';
  const telegram = contact?.telegram || '';

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 sm:text-5xl">
            Get in Touch
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
            Have questions about our courses or need assistance with your payment? Send us a message or reach out via support channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contact Info</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Reach us through any of these platforms. We are typically active from 9 AM to 9 PM IST.
              </p>

              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Call Us</h4>
                    <a href={`tel:+91${phone}`} className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors">
                      +91 {phone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">WhatsApp</h4>
                    <a
                      href={`https://wa.me/91${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition-colors"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Us</h4>
                    <a href={`mailto:${email}`} className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors">
                      {email}
                    </a>
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                    <InstagramIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Instagram</h4>
                    <a
                      href={`https://instagram.com/${instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-pink-500 transition-colors"
                    >
                      @{instagram}
                    </a>
                  </div>
                </div>

                {/* Telegram if exists */}
                {telegram && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Telegram</h4>
                      <a
                        href={telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-500 transition-colors"
                      >
                        Join Telegram Channel
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Note */}
            <div className="glass-card rounded-3xl p-6 bg-indigo-600/5 dark:bg-indigo-500/5 border-indigo-500/10">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">Need Payment Verification?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If you have paid and uploaded a screenshot, please note that manual approval can take up to 2-4 hours. Do not submit duplicate requests for the same transaction.
              </p>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Send Us a Query</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
