'use client';

import React, { useState } from 'react';
import { submitContactMessage } from '@/app/actions';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await submitContactMessage(formData);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  };

  if (success) {
    return (
      <div className="text-center p-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl animate-fade-in">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent Successfully!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Thank you for reaching out. Our support team will review your query and reply shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Your Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="How can we help you?"
          disabled={loading}
          className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Message / Support Query
        </label>
        <textarea
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="Describe your issue or query in detail..."
          disabled={loading}
          className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send Message
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
