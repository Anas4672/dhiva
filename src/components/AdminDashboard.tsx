'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  approvePaymentRequest,
  rejectPaymentRequest,
  replyToContactMessage,
  updateContactSettings,
  createOrUpdateCourse,
  deleteCourse,
  createOrUpdateModule,
  deleteModule,
  createOrUpdateLesson,
  deleteLesson,
  grantCourseAccess,
  revokeCourseAccess,
  broadcastAnnouncement,
} from '@/app/actions';
import {
  DollarSign,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Loader2,
  Trash2,
  Edit,
  Plus,
  Settings,
  Megaphone,
  MessageSquare,
  Search,
  ExternalLink,
  Shield,
  Eye,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  instructorName: string;
  instructorBio: string | null;
  instructorAvatar: string | null;
  duration: string;
  level: string;
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      videoUrl: string | null;
      notes: string | null;
      pdfUrl: string | null;
      order: number;
    }[];
  }[];
}

interface PaymentRequest {
  id: string;
  userId: string;
  user: { name: string; email: string };
  course: { title: string };
  courseId: string;
  amount: number;
  transactionId: string;
  screenshotUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: Date;
}

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply: string | null;
  status: 'PENDING' | 'REPLIED';
  createdAt: Date;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  enrollments: { courseId: string }[];
}

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    totalCourses: number;
    activeEnrollments: number;
    totalRevenue: number;
    pendingPaymentsCount: number;
    pendingMessagesCount: number;
  };
  courses: Course[];
  payments: PaymentRequest[];
  messages: Message[];
  users: UserRecord[];
  contactSettings: {
    phone: string;
    whatsapp: string;
    email: string;
    telegram: string;
    instagram: string;
    youtube: string;
    facebook: string;
    upiId: string;
    upiQrCode: string | null;
  };
}

export default function AdminDashboard({
  stats,
  courses,
  payments,
  messages,
  users,
  contactSettings,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [globalLoading, setGlobalLoading] = useState(false);

  /* ==========================================================================
     SETTINGS STATE
     ========================================================================== */
  const [settingsData, setSettingsData] = useState(contactSettings);
  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'admin_configs');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettingsData({ ...settingsData, upiQrCode: data.url });
    } catch (err: any) {
      alert(err.message || 'Failed to upload QR code.');
    } finally {
      setQrUploading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    const res = await updateContactSettings(settingsData);
    setGlobalLoading(false);
    if (res.success) {
      alert('Settings updated successfully!');
      router.refresh();
    } else {
      alert(res.error || 'Failed to update settings.');
    }
  };

  /* ==========================================================================
     ANNOUNCEMENT BROADCAST
     ========================================================================== */
  const [announcementText, setAnnouncementText] = useState('');
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setGlobalLoading(true);
    const res = await broadcastAnnouncement(announcementText);
    setGlobalLoading(false);
    if (res.success) {
      alert(`Announcement broadcasted to ${res.count} users successfully!`);
      setAnnouncementText('');
    } else {
      alert(res.error || 'Broadcast failed.');
    }
  };

  /* ==========================================================================
     PAYMENT AUDITING STATE
     ========================================================================== */
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprovePayment = async (id: string) => {
    if (!confirm('Are you sure you want to approve this payment request? This grants access.')) return;
    setGlobalLoading(true);
    const res = await approvePaymentRequest(id);
    setGlobalLoading(false);
    if (res.success) {
      setSelectedPayment(null);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleRejectPayment = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    setGlobalLoading(true);
    const res = await rejectPaymentRequest(id, rejectionReason);
    setGlobalLoading(false);
    if (res.success) {
      setSelectedPayment(null);
      setRejectionReason('');
      setShowRejectForm(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  /* ==========================================================================
     SUPPORT TICKETS STATE
     ========================================================================== */
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReplyMessage = async (id: string) => {
    if (!replyText.trim()) return;
    setGlobalLoading(true);
    const res = await replyToContactMessage(id, replyText);
    setGlobalLoading(false);
    if (res.success) {
      setSelectedMessage(null);
      setReplyText('');
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  /* ==========================================================================
     MANUAL ENROLLMENT OVERRIDES
     ========================================================================== */
  const [userSearch, setUserSearch] = useState('');
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleToggleEnrollment = async (userRecord: UserRecord, courseId: string, enrolled: boolean) => {
    setGlobalLoading(true);
    let res;
    if (enrolled) {
      res = await revokeCourseAccess(userRecord.id, courseId);
    } else {
      res = await grantCourseAccess(userRecord.id, courseId);
    }
    setGlobalLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  /* ==========================================================================
     CURRICULUM CRUD STATE
     ========================================================================== */
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    price: 1999,
    instructorName: 'Dhiva',
    instructorBio: 'Full Stack engineer and educator.',
    instructorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    duration: '40 Hours',
    level: 'Beginner',
  });
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const handleCourseThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'thumbnails');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCourseFormData({ ...courseFormData, thumbnailUrl: data.url });
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    const res = await createOrUpdateCourse(editCourseId, courseFormData);
    setGlobalLoading(false);
    if (res.success) {
      setShowCourseForm(false);
      setEditCourseId(null);
      setCourseFormData({
        title: '',
        description: '',
        thumbnailUrl: '',
        price: 1999,
        instructorName: 'Dhiva',
        instructorBio: 'Full Stack engineer and educator.',
        instructorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        duration: '40 Hours',
        level: 'Beginner',
      });
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This deletes modules, lessons, and enrollment details.')) return;
    setGlobalLoading(true);
    const res = await deleteCourse(id);
    setGlobalLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  // Modules CRUD
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleCourseId, setModuleCourseId] = useState('');
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [moduleFormData, setModuleFormData] = useState({ title: '', order: 1 });

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    const res = await createOrUpdateModule(editModuleId, {
      ...moduleFormData,
      courseId: moduleCourseId,
    });
    setGlobalLoading(false);
    if (res.success) {
      setShowModuleForm(false);
      setEditModuleId(null);
      setModuleFormData({ title: '', order: 1 });
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  // Lessons CRUD
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState('');
  const [lessonCourseId, setLessonCourseId] = useState('');
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    videoUrl: '',
    notes: '',
    pdfUrl: '',
    order: 1,
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'pdf_materials');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLessonFormData({ ...lessonFormData, pdfUrl: data.url });
    } catch (err: any) {
      alert(err.message || 'PDF upload failed');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    const res = await createOrUpdateLesson(editLessonId, {
      ...lessonFormData,
      moduleId: lessonModuleId,
      courseId: lessonCourseId,
    });
    setGlobalLoading(false);
    if (res.success) {
      setShowLessonForm(false);
      setEditLessonId(null);
      setLessonFormData({ title: '', videoUrl: '', notes: '', pdfUrl: '', order: 1 });
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Tabs list */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800">
        {[
          { id: 'overview', name: 'Stats Overview' },
          { id: 'curriculum', name: 'Curriculum (CRUD)' },
          { id: 'payments', name: `Payments (${payments.filter(p => p.status === 'PENDING').length})` },
          { id: 'messages', name: `Messages (${messages.filter(m => m.status === 'PENDING').length})` },
          { id: 'enrollment', name: 'Access Overrides' },
          { id: 'announcements', name: 'Broadcasts' },
          { id: 'settings', name: 'UPI Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Dashboard cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-3xl p-6 bg-indigo-600/5 border-indigo-500/10">
              <DollarSign className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Revenue</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="glass-card rounded-3xl p-6 bg-sky-600/5 border-sky-500/10">
              <Users className="w-6 h-6 text-sky-500 mb-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Registered Students</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</span>
            </div>
            <div className="glass-card rounded-3xl p-6 bg-emerald-600/5 border-emerald-500/10">
              <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Enrollments</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeEnrollments}</span>
            </div>
            <div className="glass-card rounded-3xl p-6 bg-purple-600/5 border-purple-500/10">
              <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Courses</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalCourses}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Pending Payment List */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Recent Payment Alerts</h3>
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {stats.pendingPaymentsCount} PENDING
                </span>
              </div>
              <div className="space-y-3">
                {payments.filter(p => p.status === 'PENDING').slice(0, 5).map((pay) => (
                  <div key={pay.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900 rounded-xl">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{pay.user.name}</span>
                      <span className="text-[10px] text-slate-400">{pay.course.title}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPayment(pay);
                        setActiveTab('payments');
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Audit Proof
                    </button>
                  </div>
                ))}
                {stats.pendingPaymentsCount === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">All payment checks are complete.</p>
                )}
              </div>
            </div>

            {/* Quick Messages */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Recent User Enquiries</h3>
                <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                  {stats.pendingMessagesCount} PENDING
                </span>
              </div>
              <div className="space-y-3">
                {messages.filter(m => m.status === 'PENDING').slice(0, 5).map((msg) => (
                  <div key={msg.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-900 rounded-xl">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{msg.subject}</span>
                      <span className="text-[10px] text-slate-400">From: {msg.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMessage(msg);
                        setActiveTab('messages');
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Write Reply
                    </button>
                  </div>
                ))}
                {stats.pendingMessagesCount === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No pending support messages.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CURRICULUM (CRUD) */}
      {activeTab === 'curriculum' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Management</h2>
              <p className="text-xs text-slate-450 dark:text-slate-500">Create courses, modules, and topics.</p>
            </div>
            <button
              onClick={() => {
                setEditCourseId(null);
                setCourseFormData({
                  title: '',
                  description: '',
                  thumbnailUrl: '',
                  price: 1999,
                  instructorName: 'Dhiva',
                  instructorBio: 'Full Stack engineer and educator.',
                  instructorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                  duration: '40 Hours',
                  level: 'Beginner',
                });
                setShowCourseForm(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Course
            </button>
          </div>

          {/* ADD / EDIT COURSE FORM MODAL */}
          {showCourseForm && (
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                {editCourseId ? 'Edit Course Details' : 'Create New Course'}
              </h3>
              <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Course Title</label>
                    <input
                      type="text"
                      required
                      value={courseFormData.title}
                      onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={courseFormData.price}
                      onChange={(e) => setCourseFormData({ ...courseFormData, price: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Course Description</label>
                  <textarea
                    required
                    rows={4}
                    value={courseFormData.description}
                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Level</label>
                    <select
                      value={courseFormData.level}
                      onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Duration (e.g. 40 Hours)</label>
                    <input
                      type="text"
                      value={courseFormData.duration}
                      onChange={(e) => setCourseFormData({ ...courseFormData, duration: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Upload Thumbnail</label>
                    <input type="file" onChange={handleCourseThumbnail} accept="image/*" className="hidden" id="course_thumb" />
                    <button
                      type="button"
                      disabled={thumbnailUploading}
                      onClick={() => document.getElementById('course_thumb')?.click()}
                      className="w-full p-2.5 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 font-bold flex items-center justify-center gap-1"
                    >
                      {thumbnailUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {courseFormData.thumbnailUrl ? 'Replace Thumbnail' : 'Select Image'}
                    </button>
                    {courseFormData.thumbnailUrl && <span className="text-[10px] text-emerald-500 block mt-1 truncate">Image Ready</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Instructor Name</label>
                    <input
                      type="text"
                      required
                      value={courseFormData.instructorName}
                      onChange={(e) => setCourseFormData({ ...courseFormData, instructorName: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Instructor Bio</label>
                    <input
                      type="text"
                      value={courseFormData.instructorBio || ''}
                      onChange={(e) => setCourseFormData({ ...courseFormData, instructorBio: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCourseForm(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save Course
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* COURSE LIST WITH MODULES AND LESSONS DETAILS */}
          <div className="space-y-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
              >
                {/* Course Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-16 h-10 object-cover rounded-md border border-slate-200 dark:border-slate-800"
                    />
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-md">
                        {course.title}
                      </h3>
                      <span className="text-[10px] text-slate-400">Price: ₹{course.price} | Level: {course.level}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditCourseId(course.id);
                        setCourseFormData({
                          title: course.title,
                          description: course.description,
                          thumbnailUrl: course.thumbnailUrl,
                          price: course.price,
                          instructorName: course.instructorName,
                          instructorBio: course.instructorBio || '',
                          instructorAvatar: course.instructorAvatar || '',
                          duration: course.duration,
                          level: course.level,
                        });
                        setShowCourseForm(true);
                      }}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 cursor-pointer"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-rose-50 hover:text-rose-500 text-slate-600 dark:text-slate-350 cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setModuleCourseId(course.id);
                        setEditModuleId(null);
                        setModuleFormData({ title: '', order: course.modules.length + 1 });
                        setShowModuleForm(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-indigo-600 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Module
                    </button>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="space-y-4">
                  {course.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-3"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-2">
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                          {mod.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setModuleCourseId(course.id);
                              setEditModuleId(mod.id);
                              setModuleFormData({ title: mod.title, order: mod.order });
                              setShowModuleForm(true);
                            }}
                            className="text-[10px] text-indigo-500 font-bold hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this module and all its lessons?')) {
                                deleteModule(mod.id, course.id);
                              }
                            }}
                            className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setLessonCourseId(course.id);
                              setLessonModuleId(mod.id);
                              setEditLessonId(null);
                              setLessonFormData({ title: '', videoUrl: '', notes: '', pdfUrl: '', order: mod.lessons.length + 1 });
                              setShowLessonForm(true);
                            }}
                            className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-0.5 cursor-pointer ml-2"
                          >
                            <Plus className="w-3 h-3" /> Topic
                          </button>
                        </div>
                      </div>

                      {/* Lessons list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {mod.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-[11px]"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-350 truncate pr-2 max-w-[120px]" title={lesson.title}>
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setLessonCourseId(course.id);
                                  setLessonModuleId(mod.id);
                                  setEditLessonId(lesson.id);
                                  setLessonFormData({
                                    title: lesson.title,
                                    videoUrl: lesson.videoUrl || '',
                                    notes: lesson.notes || '',
                                    pdfUrl: lesson.pdfUrl || '',
                                    order: lesson.order,
                                  });
                                  setShowLessonForm(true);
                                }}
                                className="text-indigo-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this topic?')) {
                                    deleteLesson(lesson.id, course.id);
                                  }
                                }}
                                className="text-rose-500 font-bold hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* MODAL: ADD / EDIT MODULE FORM */}
          {showModuleForm && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  {editModuleId ? 'Edit Module Name' : 'Create Module'}
                </h3>
                <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Module Name / Header</label>
                    <input
                      type="text"
                      required
                      value={moduleFormData.title}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                      placeholder="e.g. Module 1: Intro to Web Basics"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Order Sequence Number</label>
                    <input
                      type="number"
                      required
                      value={moduleFormData.order}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, order: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModuleForm(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer"
                    >
                      Save Module
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: ADD / EDIT LESSON FORM */}
          {showLessonForm && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  {editLessonId ? 'Edit Topic Details' : 'Create Topic'}
                </h3>
                <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Topic Title</label>
                    <input
                      type="text"
                      required
                      value={lessonFormData.title}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                      placeholder="e.g. Course Overview"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Video Link (YouTube Embed or direct URL)</label>
                    <input
                      type="text"
                      value={lessonFormData.videoUrl}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
                      placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Upload PDF Study Material</label>
                    <input type="file" onChange={handlePdfUpload} accept="application/pdf" className="hidden" id="lesson_pdf" />
                    <button
                      type="button"
                      disabled={pdfUploading}
                      onClick={() => document.getElementById('lesson_pdf')?.click()}
                      className="w-full p-2.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-950 font-bold flex items-center justify-center gap-1"
                    >
                      {pdfUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {lessonFormData.pdfUrl ? 'Replace PDF File' : 'Select PDF file'}
                    </button>
                    {lessonFormData.pdfUrl && <span className="text-[10px] text-emerald-500 block mt-1 truncate">PDF Link Ready</span>}
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Lecture Notes / Reading Content (HTML)</label>
                    <textarea
                      rows={5}
                      value={lessonFormData.notes}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, notes: e.target.value })}
                      placeholder="<h3>Heading</h3><p>Content...</p>"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Order Sequence (e.g. 1 to 6)</label>
                    <input
                      type="number"
                      required
                      value={lessonFormData.order}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, order: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLessonForm(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer"
                    >
                      Save Topic
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. VERIFY PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Manual UPI Payments</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Cross-reference Transaction IDs and screenshots to approve course unlocks.</p>
          </div>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No payment requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Ref Number / Tx ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950/20 font-medium">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{pay.user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{pay.user.email}</div>
                      </td>
                      <td className="py-3 px-4 truncate max-w-[150px]" title={pay.course.title}>{pay.course.title}</td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{pay.transactionId}</td>
                      <td className="py-3 px-4 font-bold text-indigo-500">₹{pay.amount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                            pay.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                              : pay.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedPayment(pay);
                            setShowRejectForm(false);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-600 hover:text-white cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* AUDIT PAYMENT REQUEST MODAL */}
          {selectedPayment && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Audit Payment Request</h3>
                  <button className="text-slate-400 text-xs font-bold hover:underline" onClick={() => setSelectedPayment(null)}>Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">STUDENT</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPayment.user.name}</span>
                    <span className="text-[9px] text-slate-400 block truncate font-mono">{selectedPayment.user.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">COURSE</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{selectedPayment.course.title}</span>
                    <span className="text-[9px] text-indigo-500 font-bold">Amount: ₹{selectedPayment.amount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">SUBMITTED DATE</span>
                    <span className="font-medium text-slate-700 dark:text-slate-350">
                      {new Date(selectedPayment.createdAt).toLocaleDateString()} at {new Date(selectedPayment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold">TRANSACTION ID / REF NUMBER</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white select-all">{selectedPayment.transactionId}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-450 block font-bold">SUBMITTED RECEIPT SCREENSHOT</span>
                  <a href={selectedPayment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800 group" title="Open image in new window">
                    <img src={selectedPayment.screenshotUrl} alt="Receipt proof" className="object-contain w-full h-full" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-[11px]">
                      Open Image In New Tab <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                </div>

                {selectedPayment.status === 'PENDING' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-4">
                    {!showRejectForm ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold cursor-pointer"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleApprovePayment(selectedPayment.id)}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1"
                        >
                          Approve and Unlock Course
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-rose-50/20 p-4 border border-rose-500/10 rounded-2xl">
                        <label className="block font-bold text-rose-500">Provide Rejection Reason</label>
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Screenshot blur / Reference Number incorrect"
                          className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPayment(selectedPayment.id)}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
                          >
                            Submit Rejection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SUPPORT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Messages & Inquiries</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Reply to contact forms and support queries submitted by users.</p>
          </div>

          {messages.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No support messages submitted yet.</p>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 text-xs"
                >
                  <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-850 pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{msg.subject}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        From: <strong>{msg.name}</strong> ({msg.email}) | Sent on {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                        msg.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed font-medium">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">MESSAGE:</span>
                    {msg.message}
                  </div>

                  {msg.reply ? (
                    <div className="bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-xl border border-indigo-150/10 text-indigo-700 dark:text-sky-300 leading-relaxed font-semibold">
                      <span className="text-[10px] text-indigo-400 font-bold block mb-1">YOUR REPLY:</span>
                      {msg.reply}
                    </div>
                  ) : (
                    <div>
                      {selectedMessage?.id === msg.id ? (
                        <div className="space-y-3 pt-2">
                          <textarea
                            rows={4}
                            placeholder="Write your support reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setSelectedMessage(null)}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReplyMessage(msg.id)}
                              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold cursor-pointer"
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedMessage(msg);
                            setReplyText('');
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer"
                        >
                          Write Response Reply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. ACCESS OVERRIDES */}
      {activeTab === 'enrollment' && (
        <div className="space-y-6 animate-fade-in text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manual Access Overrides</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Manually grant or revoke course access for individual students.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.map((userRecord) => (
              <div
                key={userRecord.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{userRecord.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{userRecord.email}</span>
                </div>

                {/* Course override buttons */}
                <div className="flex flex-wrap gap-3">
                  {courses.map((course) => {
                    const isEnrolled = userRecord.enrollments.some((e) => e.courseId === course.id);
                    return (
                      <button
                        key={course.id}
                        onClick={() => handleToggleEnrollment(userRecord, course.id, isEnrolled)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          isEnrolled
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-650 hover:text-white border border-transparent'
                        }`}
                        title={course.title}
                      >
                        {course.title.slice(0, 15)}...: {isEnrolled ? 'Active (Revoke)' : 'Grant Access'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ANNOUNCEMENT BROADCASTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-fade-in text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Broadcast System Notifications</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Send an announcement notification alerts directly to the dashboard of every registered student.</p>
          </div>

          <div className="glass-card rounded-3xl p-6 max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Announcement Message Text</label>
                <textarea
                  required
                  rows={4}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Schedule Update: Live session tomorrow at 7 PM IST on NextAuth configurations."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Megaphone className="w-4 h-4" /> Broadcast Announcement Alert
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">LMS Platform Settings</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Configure active support contact numbers, social link bindings, and UPI configurations.</p>
          </div>

          <form onSubmit={handleSettingsSubmit} className="glass-card rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 max-w-3xl">
            
            {/* UPI Config */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-500" /> Manual Payment Configurations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Active UPI ID (checkout pay address)</label>
                  <input
                    type="text"
                    required
                    value={settingsData.upiId}
                    onChange={(e) => setSettingsData({ ...settingsData, upiId: e.target.value })}
                    placeholder="e.g. 9894112566@ybl"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">UPI Static QR Code (Image Override)</label>
                  <input type="file" ref={fileInputRef} onChange={handleQrUpload} accept="image/*" className="hidden" />
                  <button
                    type="button"
                    disabled={qrUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 font-bold flex items-center justify-center gap-1"
                  >
                    {qrUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {settingsData.upiQrCode ? 'Replace Uploaded QR' : 'Upload Static QR Image'}
                  </button>
                  {settingsData.upiQrCode && <span className="text-[9px] text-emerald-500 block mt-1 truncate">Static QR Code Upload Active</span>}
                </div>
              </div>
            </div>

            {/* Contacts & socials */}
            <div className="pt-6 border-t border-slate-150 dark:border-slate-800 space-y-4">
              <h3 className="font-extrabold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-500" /> Help Channels & Coordinates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={settingsData.phone}
                    onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    required
                    value={settingsData.whatsapp}
                    onChange={(e) => setSettingsData({ ...settingsData, whatsapp: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Support Email Address</label>
                  <input
                    type="email"
                    required
                    value={settingsData.email}
                    onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Instagram Link (dhiva__28)</label>
                  <input
                    type="text"
                    value={settingsData.instagram}
                    onChange={(e) => setSettingsData({ ...settingsData, instagram: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Telegram Link (Channel URL)</label>
                  <input
                    type="text"
                    value={settingsData.telegram}
                    onChange={(e) => setSettingsData({ ...settingsData, telegram: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">YouTube Link</label>
                  <input
                    type="text"
                    value={settingsData.youtube}
                    onChange={(e) => setSettingsData({ ...settingsData, youtube: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
            >
              Save Configuration Settings
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
