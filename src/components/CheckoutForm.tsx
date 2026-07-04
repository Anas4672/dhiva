'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { submitPaymentRequest } from '@/app/actions';
import QRCode from 'qrcode';
import { Loader2, Upload, AlertCircle, CheckCircle, Shield, Sparkles } from 'lucide-react';

interface CheckoutFormProps {
  course: {
    id: string;
    title: string;
    price: number;
  };
  contact: {
    upiId: string;
    upiQrCode: string | null;
  };
}

export default function CheckoutForm({ course, contact }: CheckoutFormProps) {
  const router = useRouter();
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // UI states
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate dynamic QR Code if there's no custom static image uploaded by admin
  useEffect(() => {
    if (!contact.upiQrCode) {
      const upiLink = `upi://pay?pa=${contact.upiId}&pn=DhivaCourse&am=${course.price}&cu=INR`;
      QRCode.toDataURL(upiLink, { width: 300, margin: 2 })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [course, contact]);

  // Handle Screenshot Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'screenshots');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload screenshot');
      }

      setScreenshotUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Please try again.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  // Submit checkout form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Please enter the UPI Transaction ID.');
      return;
    }
    if (!screenshotUrl) {
      setError('Please upload your payment screenshot.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await submitPaymentRequest({
        courseId: course.id,
        amount: course.price,
        transactionId: transactionId.trim(),
        screenshotUrl,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError('Failed to submit request. Please check connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl animate-fade-in space-y-6">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Proof Submitted!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Your payment request was sent to the administrator. Once manually verified, the course will automatically unlock and a notification will be sent.
        </p>
        <p className="text-xs text-indigo-500/70 dark:text-sky-400 font-semibold font-mono">
          Redirecting to dashboard in a moment...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* QR Code and Pay Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
        {/* QR Code Output */}
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
          {contact.upiQrCode ? (
            <img
              src={contact.upiQrCode}
              alt="UPI QR Code"
              className="max-w-[200px] h-auto object-contain"
            />
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Dynamic UPI QR Code"
              className="max-w-[200px] h-auto object-contain"
            />
          ) : (
            <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-400 mt-2 block tracking-wider uppercase">SCAN TO PAY ₹{course.price}</span>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Direct Payment
          </div>
          <h3 className="text-md font-bold text-slate-900 dark:text-white">Payment Steps:</h3>
          <ol className="list-decimal pl-4 text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
            <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM, etc.).</li>
            <li>Scan the generated QR code or pay manually to UPI ID: <strong className="text-slate-800 dark:text-slate-200 select-all font-mono">{contact.upiId}</strong></li>
            <li>Complete the payment of <strong>₹{course.price}</strong>.</li>
            <li>Take a screenshot of the completed transaction screen showing the reference number / Transaction ID.</li>
          </ol>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* Transaction ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            UPI Transaction ID / Ref Number (12 digits)
          </label>
          <input
            type="text"
            required
            value={transactionId}
            onChange={(e) => {
              setTransactionId(e.target.value);
              setError('');
            }}
            placeholder="e.g. 314562789123"
            disabled={submitting}
            className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Screenshot upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Upload Payment Screenshot Receipt
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            disabled={uploading || submitting}
            className="hidden"
          />
          <div
            onClick={() => !uploading && !submitting && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              screenshotUrl
                ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-slate-100/10 hover:bg-indigo-50/5'
            }`}
          >
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Uploading to Cloudinary...</p>
              </div>
            ) : screenshotUrl ? (
              <div className="space-y-3">
                <img
                  src={screenshotUrl}
                  alt="Uploaded receipt"
                  className="max-h-[140px] rounded-lg mx-auto object-cover border border-slate-200 dark:border-slate-800"
                />
                <p className="text-xs text-indigo-600 dark:text-sky-400 font-semibold">
                  Screenshot uploaded successfully! Click to replace.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to Select Screenshot</p>
                <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP files up to 5MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={uploading || submitting || !screenshotUrl}
        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all mt-6"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Submit Payment Request
            <Shield className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
