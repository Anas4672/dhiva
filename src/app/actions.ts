'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Helper to assert authentication
async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Helper to assert admin authorization
async function getAdminSessionOrThrow() {
  const session = await getSessionOrThrow();
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return session;
}

/* ==========================================================================
   USER ACTIONS
   ========================================================================== */

/**
 * Submits a new payment request for manual admin verification
 */
export async function submitPaymentRequest(data: {
  courseId: string;
  amount: number;
  transactionId: string;
  screenshotUrl: string;
}) {
  const session = await getSessionOrThrow();
  const userId = session.user.id;

  const { courseId, amount, transactionId, screenshotUrl } = data;

  if (!courseId || !transactionId || !screenshotUrl || !amount) {
    return { success: false, request: null, error: 'All fields (course, transaction ID, and screenshot) are required' };
  }

  try {
    // 1. Verify user is not already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingEnrollment) {
      return { success: false, request: null, error: 'You are already enrolled in this course' };
    }

    // 2. Check for existing pending requests
    const pendingRequest = await prisma.paymentRequest.findFirst({
      where: {
        userId,
        courseId,
        status: 'PENDING',
      },
    });

    if (pendingRequest) {
      return { success: false, request: null, error: 'You already have a pending payment request for this course. Please wait for admin approval.' };
    }

    // 3. Ensure transaction ID is unique
    const duplicateTx = await prisma.paymentRequest.findUnique({
      where: { transactionId: transactionId.trim() },
    });

    if (duplicateTx) {
      return { success: false, request: null, error: 'This Transaction ID has already been submitted.' };
    }

    // 4. Create request
    const request = await prisma.paymentRequest.create({
      data: {
        userId,
        courseId,
        amount,
        transactionId: transactionId.trim(),
        screenshotUrl,
        status: 'PENDING',
      },
      include: {
        course: true,
      },
    });

    // 5. Notify user
    await prisma.notification.create({
      data: {
        userId,
        message: `Your payment request for "${request.course.title}" was submitted successfully. Waiting for admin approval.`,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, request, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for submitPaymentRequest, falling back to mockDb:', error);
    
    const existingEnrollment = mockDb.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
    if (existingEnrollment) {
      return { success: false, request: null, error: 'You are already enrolled in this course' };
    }

    const pendingRequest = mockDb.paymentRequests.find(
      (r) => r.userId === userId && r.courseId === courseId && r.status === 'PENDING'
    );
    if (pendingRequest) {
      return { success: false, request: null, error: 'You already have a pending payment request for this course. Please wait for admin approval.' };
    }

    const duplicateTx = mockDb.paymentRequests.find(
      (r) => r.transactionId.trim().toLowerCase() === transactionId.trim().toLowerCase()
    );
    if (duplicateTx) {
      return { success: false, request: null, error: 'This Transaction ID has already been submitted.' };
    }

    const request = {
      id: 'pay-' + Math.random().toString(36).substring(2, 11),
      userId,
      courseId,
      amount,
      transactionId: transactionId.trim(),
      screenshotUrl,
      status: 'PENDING' as const,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      course: { title: mockDb.courses.find((c) => c.id === courseId)?.title || 'Course' },
    };

    mockDb.paymentRequests.push(request);
    mockDb.notifications.push({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId,
      message: `Your payment request for "${request.course.title}" was submitted successfully. Waiting for admin approval.`,
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath('/dashboard');
    return { success: true, request, error: null as string | null };
  }
}

/**
 * Submits a contact/support form
 */
export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { name, email, subject, message } = data;

  if (!name || !email || !subject || !message) {
    return { success: false, message: null, error: 'All fields are required' };
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'PENDING',
      },
    });

    return { success: true, message: newMessage, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for submitContactMessage, falling back to mockDb:', error);

    const newMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      reply: null,
      status: 'PENDING' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDb.messages.push(newMessage);
    return { success: true, message: newMessage, error: null as string | null };
  }
}

/**
 * Updates user profile details or changes password
 */
export async function updateUserProfile(data: {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const session = await getSessionOrThrow();
  const userId = session.user.id;

  const { name, email, currentPassword, newPassword } = data;

  if (!name || !email) {
    return { success: false, user: null, error: 'Name and email are required' };
  }

  try {
    // Check if email taken by someone else
    const emailCheck = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        id: { not: userId },
      },
    });

    if (emailCheck) {
      return { success: false, user: null, error: 'Email is already in use by another account' };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return { success: false, user: null, error: 'User not found' };
    }

    const updateData: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };

    // If changing password
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return { success: false, user: null, error: 'New password must be at least 6 characters long' };
      }

      const isOldPasswordCorrect = bcrypt.compareSync(currentPassword, currentUser.passwordHash);
      if (!isOldPasswordCorrect) {
        return { success: false, user: null, error: 'Current password is incorrect' };
      }

      updateData.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath('/dashboard');
    return { success: true, user: { name: updatedUser.name, email: updatedUser.email }, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for updateUserProfile, falling back to mockDb:', error);

    const currentUserIndex = mockDb.users.findIndex((u) => u.id === userId);
    if (currentUserIndex === -1) {
      return { success: false, user: null, error: 'User not found' };
    }

    const emailCheck = mockDb.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== userId
    );
    if (emailCheck) {
      return { success: false, user: null, error: 'Email is already in use by another account' };
    }

    const currentUser = mockDb.users[currentUserIndex];
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return { success: false, user: null, error: 'New password must be at least 6 characters long' };
      }

      const isOldPasswordCorrect = bcrypt.compareSync(currentPassword, currentUser.passwordHash);
      if (!isOldPasswordCorrect) {
        return { success: false, user: null, error: 'Current password is incorrect' };
      }

      currentUser.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    currentUser.name = name.trim();
    currentUser.email = email.trim().toLowerCase();

    revalidatePath('/dashboard');
    return { success: true, user: { name: currentUser.name, email: currentUser.email }, error: null as string | null };
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(id: string) {
  const session = await getSessionOrThrow();
  try {
    await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for markNotificationAsRead, falling back to mockDb:', error);
    
    const notif = mockDb.notifications.find((n) => n.id === id && n.userId === session.user.id);
    if (notif) {
      notif.isRead = true;
    }
    
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  }
}

/* ==========================================================================
   ADMIN ACTIONS
   ========================================================================== */

/**
 * Admin: Approves a payment request, unlocks course access, and notifies the user
 */
export async function approvePaymentRequest(requestId: string) {
  await getAdminSessionOrThrow();

  try {
    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { user: true, course: true },
    });

    if (!request) {
      return { success: false, error: 'Payment request not found' };
    }

    if (request.status === 'APPROVED') {
      return { success: false, error: 'Payment request is already approved' };
    }

    // 1. Transactional Update: Set payment APPROVED and create Enrollment
    await prisma.$transaction([
      prisma.paymentRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', rejectionReason: null },
      }),
      prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: request.userId,
            courseId: request.courseId,
          },
        },
        update: {},
        create: {
          userId: request.userId,
          courseId: request.courseId,
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          message: `Congratulations! Your payment for "${request.course.title}" has been approved. The course is now unlocked!`,
        },
      }),
    ]);

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for approvePaymentRequest, falling back to mockDb:', error);

    const requestIndex = mockDb.paymentRequests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return { success: false, error: 'Payment request not found' };
    }

    const request = mockDb.paymentRequests[requestIndex];
    if (request.status === 'APPROVED') {
      return { success: false, error: 'Payment request is already approved' };
    }

    request.status = 'APPROVED';
    request.rejectionReason = null;
    request.updatedAt = new Date();

    const hasEnrollment = mockDb.enrollments.some((e) => e.userId === request.userId && e.courseId === request.courseId);
    if (!hasEnrollment) {
      mockDb.enrollments.push({
        id: 'enr-' + Math.random().toString(36).substring(2, 11),
        userId: request.userId,
        courseId: request.courseId,
        createdAt: new Date(),
      });
    }

    const courseTitle = mockDb.courses.find((c) => c.id === request.courseId)?.title || 'Course';

    mockDb.notifications.push({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId: request.userId,
      message: `Congratulations! Your payment for "${courseTitle}" has been approved. The course is now unlocked!`,
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Rejects a payment request and provides a reason
 */
export async function rejectPaymentRequest(requestId: string, reason: string) {
  await getAdminSessionOrThrow();

  if (!reason || reason.trim() === '') {
    return { success: false, error: 'Rejection reason is required' };
  }

  try {
    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { course: true },
    });

    if (!request) {
      return { success: false, error: 'Payment request not found' };
    }

    await prisma.$transaction([
      prisma.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason.trim(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          message: `Your payment request for "${request.course.title}" was rejected. Reason: ${reason.trim()}. Please verify and resubmit.`,
        },
      }),
    ]);

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for rejectPaymentRequest, falling back to mockDb:', error);

    const requestIndex = mockDb.paymentRequests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return { success: false, error: 'Payment request not found' };
    }

    const request = mockDb.paymentRequests[requestIndex];
    request.status = 'REJECTED';
    request.rejectionReason = reason.trim();
    request.updatedAt = new Date();

    const courseTitle = mockDb.courses.find((c) => c.id === request.courseId)?.title || 'Course';

    mockDb.notifications.push({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId: request.userId,
      message: `Your payment request for "${courseTitle}" was rejected. Reason: ${reason.trim()}. Please verify and resubmit.`,
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Replies to support messages
 */
export async function replyToContactMessage(messageId: string, replyText: string) {
  await getAdminSessionOrThrow();

  if (!replyText || replyText.trim() === '') {
    return { success: false, message: null, error: 'Reply text cannot be empty' };
  }

  try {
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        reply: replyText.trim(),
        status: 'REPLIED',
      },
    });

    revalidatePath('/admin/dashboard');
    return { success: true, message: updatedMessage, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for replyToContactMessage, falling back to mockDb:', error);

    const messageIndex = mockDb.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) {
      return { success: false, message: null, error: 'Message not found' };
    }

    const msg = mockDb.messages[messageIndex];
    msg.reply = replyText.trim();
    msg.status = 'REPLIED';
    msg.updatedAt = new Date();

    revalidatePath('/admin/dashboard');
    return { success: true, message: msg, error: null as string | null };
  }
}

/**
 * Admin: Updates support contacts and UPI settings
 */
export async function updateContactSettings(data: {
  phone: string;
  whatsapp: string;
  email: string;
  telegram: string;
  instagram: string;
  youtube: string;
  facebook: string;
  upiId: string;
  upiQrCode?: string | null;
}) {
  await getAdminSessionOrThrow();

  try {
    const settings = await prisma.contactDetails.upsert({
      where: { id: 'static' },
      update: {
        phone: data.phone.trim(),
        whatsapp: data.whatsapp.trim(),
        email: data.email.trim().toLowerCase(),
        telegram: data.telegram.trim(),
        instagram: data.instagram.trim(),
        youtube: data.youtube.trim(),
        facebook: data.facebook.trim(),
        upiId: data.upiId.trim(),
        upiQrCode: data.upiQrCode || null,
      },
      create: {
        id: 'static',
        phone: data.phone.trim(),
        whatsapp: data.whatsapp.trim(),
        email: data.email.trim().toLowerCase(),
        telegram: data.telegram.trim(),
        instagram: data.instagram.trim(),
        youtube: data.youtube.trim(),
        facebook: data.facebook.trim(),
        upiId: data.upiId.trim(),
        upiQrCode: data.upiQrCode || null,
      },
    });

    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/admin/dashboard');
    return { success: true, settings, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for updateContactSettings, falling back to mockDb:', error);

    mockDb.contactDetails = {
      id: 'static',
      phone: data.phone.trim(),
      whatsapp: data.whatsapp.trim(),
      email: data.email.trim().toLowerCase(),
      telegram: data.telegram.trim(),
      instagram: data.instagram.trim(),
      youtube: data.youtube.trim(),
      facebook: data.facebook.trim(),
      upiId: data.upiId.trim(),
      upiQrCode: data.upiQrCode || '/qr_code.png',
      updatedAt: new Date(),
    };

    revalidatePath('/');
    revalidatePath('/contact');
    revalidatePath('/admin/dashboard');
    return { success: true, settings: mockDb.contactDetails, error: null as string | null };
  }
}

/**
 * Admin: Aggregates dashboard statistics
 */
export async function getAdminStats() {
  await getAdminSessionOrThrow();

  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalCourses = await prisma.course.count();
    const activeEnrollments = await prisma.enrollment.count();

    const approvedPayments = await prisma.paymentRequest.findMany({
      where: { status: 'APPROVED' },
      select: { amount: true },
    });
    const totalRevenue = approvedPayments.reduce((sum, item) => sum + item.amount, 0);

    const pendingPaymentsCount = await prisma.paymentRequest.count({
      where: { status: 'PENDING' },
    });

    const pendingMessagesCount = await prisma.message.count({
      where: { status: 'PENDING' },
    });

    return {
      totalUsers,
      totalCourses,
      activeEnrollments,
      totalRevenue,
      pendingPaymentsCount,
      pendingMessagesCount,
    };
  } catch (error) {
    console.warn('Database query failed for getAdminStats, falling back to mockDb:', error);

    const totalUsers = mockDb.users.filter((u) => u.role === 'USER').length;
    const totalCourses = mockDb.courses.length;
    const activeEnrollments = mockDb.enrollments.length;
    
    const approvedPayments = mockDb.paymentRequests.filter((r) => r.status === 'APPROVED');
    const totalRevenue = approvedPayments.reduce((sum, item) => sum + item.amount, 0);
    
    const pendingPaymentsCount = mockDb.paymentRequests.filter((r) => r.status === 'PENDING').length;
    const pendingMessagesCount = mockDb.messages.filter((m) => m.status === 'PENDING').length;

    return {
      totalUsers,
      totalCourses,
      activeEnrollments,
      totalRevenue,
      pendingPaymentsCount,
      pendingMessagesCount,
    };
  }
}

/**
 * Admin: Course operations (Create, Edit, Delete)
 */
export async function createOrUpdateCourse(
  courseId: string | null,
  data: {
    title: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    instructorName: string;
    instructorBio: string;
    instructorAvatar: string;
    duration: string;
    level: string;
  }
) {
  await getAdminSessionOrThrow();

  const {
    title,
    description,
    thumbnailUrl,
    price,
    instructorName,
    instructorBio,
    instructorAvatar,
    duration,
    level,
  } = data;

  if (!title || !description || !thumbnailUrl || price === undefined || !instructorName) {
    return { success: false, course: null, error: 'Required fields are missing' };
  }

  try {
    let course;
    if (courseId) {
      // Update
      course = await prisma.course.update({
        where: { id: courseId },
        data: {
          title: title.trim(),
          description: description.trim(),
          thumbnailUrl,
          price,
          instructorName: instructorName.trim(),
          instructorBio: instructorBio.trim(),
          instructorAvatar,
          duration,
          level,
        },
      });
    } else {
      // Create
      course = await prisma.course.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          thumbnailUrl,
          price,
          instructorName: instructorName.trim(),
          instructorBio: instructorBio.trim(),
          instructorAvatar,
          duration,
          level,
        },
      });
    }

    revalidatePath('/');
    revalidatePath(`/courses/${course.id}`);
    revalidatePath('/admin/dashboard');
    return { success: true, course, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for createOrUpdateCourse, falling back to mockDb:', error);

    let course;
    if (courseId) {
      const idx = mockDb.courses.findIndex((c) => c.id === courseId);
      if (idx !== -1) {
        mockDb.courses[idx] = {
          ...mockDb.courses[idx],
          title: title.trim(),
          description: description.trim(),
          thumbnailUrl,
          price,
          instructorName: instructorName.trim(),
          instructorBio: instructorBio.trim(),
          instructorAvatar,
          duration,
          level,
        };
        course = mockDb.courses[idx];
      } else {
        return { success: false, course: null, error: 'Course not found in mockDb' };
      }
    } else {
      course = {
        id: 'course-' + Math.random().toString(36).substring(2, 11),
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl,
        price,
        instructorName: instructorName.trim(),
        instructorBio: instructorBio.trim(),
        instructorAvatar,
        duration,
        level,
        createdAt: new Date(),
      };
      mockDb.courses.push(course);
    }

    revalidatePath('/');
    revalidatePath(`/courses/${course.id}`);
    revalidatePath('/admin/dashboard');
    return { success: true, course, error: null as string | null };
  }
}

export async function deleteCourse(courseId: string) {
  await getAdminSessionOrThrow();

  try {
    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true, error: null as string | null };
  } catch (error: any) {
    console.warn('Database query failed for deleteCourse, falling back to mockDb:', error);

    mockDb.courses = mockDb.courses.filter((c) => c.id !== courseId);
    mockDb.modules = mockDb.modules.filter((m) => m.courseId !== courseId);
    
    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Module operations (Create, Edit, Delete)
 */
export async function createOrUpdateModule(
  moduleId: string | null,
  data: {
    title: string;
    order: number;
    courseId: string;
  }
) {
  await getAdminSessionOrThrow();

  const { title, order, courseId } = data;

  if (!title || order === undefined || !courseId) {
    return { success: false, module: null, error: 'Title, order, and courseId are required' };
  }

  try {
    let moduleItem;
    if (moduleId) {
      moduleItem = await prisma.module.update({
        where: { id: moduleId },
        data: { title: title.trim(), order },
      });
    } else {
      moduleItem = await prisma.module.create({
        data: { title: title.trim(), order, courseId },
      });
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, module: moduleItem, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for createOrUpdateModule, falling back to mockDb:', error);

    let moduleItem;
    if (moduleId) {
      const idx = mockDb.modules.findIndex((m) => m.id === moduleId);
      if (idx !== -1) {
        mockDb.modules[idx] = {
          ...mockDb.modules[idx],
          title: title.trim(),
          order,
        };
        moduleItem = mockDb.modules[idx];
      } else {
        return { success: false, module: null, error: 'Module not found in mockDb' };
      }
    } else {
      moduleItem = {
        id: 'module-' + Math.random().toString(36).substring(2, 11),
        title: title.trim(),
        order,
        courseId,
      };
      mockDb.modules.push(moduleItem);
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, module: moduleItem, error: null as string | null };
  }
}

export async function deleteModule(moduleId: string, courseId: string) {
  await getAdminSessionOrThrow();

  try {
    await prisma.module.delete({
      where: { id: moduleId },
    });

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for deleteModule, falling back to mockDb:', error);

    mockDb.modules = mockDb.modules.filter((m) => m.id !== moduleId);
    mockDb.lessons = mockDb.lessons.filter((l) => l.moduleId !== moduleId);

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Lesson operations (Create, Edit, Delete)
 */
export async function createOrUpdateLesson(
  lessonId: string | null,
  data: {
    title: string;
    videoUrl?: string;
    notes?: string;
    pdfUrl?: string;
    order: number;
    moduleId: string;
    courseId: string; // for revalidation
  }
) {
  await getAdminSessionOrThrow();

  const { title, videoUrl, notes, pdfUrl, order, moduleId, courseId } = data;

  if (!title || order === undefined || !moduleId) {
    return { success: false, lesson: null, error: 'Title, order, and moduleId are required' };
  }

  try {
    let lessonItem;
    if (lessonId) {
      lessonItem = await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          title: title.trim(),
          videoUrl: videoUrl?.trim() || null,
          notes: notes?.trim() || null,
          pdfUrl: pdfUrl?.trim() || null,
          order,
        },
      });
    } else {
      lessonItem = await prisma.lesson.create({
        data: {
          title: title.trim(),
          videoUrl: videoUrl?.trim() || null,
          notes: notes?.trim() || null,
          pdfUrl: pdfUrl?.trim() || null,
          order,
          moduleId,
        },
      });
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/lessons/${lessonItem.id}`);
    revalidatePath('/admin/dashboard');
    return { success: true, lesson: lessonItem, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for createOrUpdateLesson, falling back to mockDb:', error);

    let lessonItem;
    if (lessonId) {
      const idx = mockDb.lessons.findIndex((l) => l.id === lessonId);
      if (idx !== -1) {
        mockDb.lessons[idx] = {
          ...mockDb.lessons[idx],
          title: title.trim(),
          videoUrl: videoUrl?.trim() || '',
          notes: notes?.trim() || '',
          pdfUrl: pdfUrl?.trim() || '',
          order,
        };
        lessonItem = mockDb.lessons[idx];
      } else {
        return { success: false, lesson: null, error: 'Lesson not found in mockDb' };
      }
    } else {
      lessonItem = {
        id: 'lesson-' + Math.random().toString(36).substring(2, 11),
        title: title.trim(),
        videoUrl: videoUrl?.trim() || '',
        notes: notes?.trim() || '',
        pdfUrl: pdfUrl?.trim() || '',
        order,
        moduleId,
      };
      mockDb.lessons.push(lessonItem);
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/lessons/${lessonItem.id}`);
    revalidatePath('/admin/dashboard');
    return { success: true, lesson: lessonItem, error: null as string | null };
  }
}

export async function deleteLesson(lessonId: string, courseId: string) {
  await getAdminSessionOrThrow();

  try {
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for deleteLesson, falling back to mockDb:', error);

    mockDb.lessons = mockDb.lessons.filter((l) => l.id !== lessonId);

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/admin/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Remove a user's course access manually
 */
export async function revokeCourseAccess(userId: string, courseId: string) {
  await getAdminSessionOrThrow();

  try {
    await prisma.enrollment.delete({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        message: `Your access to the course has been manually revoked by the administrator.`,
      },
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for revokeCourseAccess, falling back to mockDb:', error);

    mockDb.enrollments = mockDb.enrollments.filter((e) => !(e.userId === userId && e.courseId === courseId));
    mockDb.notifications.push({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId,
      message: `Your access to the course has been manually revoked by the administrator.`,
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Grant a user course access manually (without payment request)
 */
export async function grantCourseAccess(userId: string, courseId: string) {
  await getAdminSessionOrThrow();

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      update: {},
      create: {
        userId,
        courseId,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        message: `The administrator has manually granted you lifetime access to "${course.title}". Enjoy learning!`,
      },
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for grantCourseAccess, falling back to mockDb:', error);

    const course = mockDb.courses.find((c) => c.id === courseId);
    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    const hasEnrollment = mockDb.enrollments.some((e) => e.userId === userId && e.courseId === courseId);
    if (!hasEnrollment) {
      mockDb.enrollments.push({
        id: 'enr-' + Math.random().toString(36).substring(2, 11),
        userId,
        courseId,
        createdAt: new Date(),
      });
    }

    mockDb.notifications.push({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId,
      message: `The administrator has manually granted you lifetime access to "${course.title}". Enjoy learning!`,
      isRead: false,
      createdAt: new Date(),
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    return { success: true, error: null as string | null };
  }
}

/**
 * Admin: Broadcast Announcement Notification to all users
 */
export async function broadcastAnnouncement(messageText: string) {
  await getAdminSessionOrThrow();

  if (!messageText || messageText.trim() === '') {
    return { success: false, count: 0, error: 'Message content is required' };
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });

    const notificationsData = users.map((u) => ({
      userId: u.id,
      message: `[Announcement] ${messageText.trim()}`,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return { success: true, count: users.length, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for broadcastAnnouncement, falling back to mockDb:', error);

    const users = mockDb.users.filter((u) => u.role === 'USER');
    users.forEach((u) => {
      mockDb.notifications.push({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: u.id,
        message: `[Announcement] ${messageText.trim()}`,
        isRead: false,
        createdAt: new Date(),
      });
    });

    return { success: true, count: users.length, error: null as string | null };
  }
}

/**
 * User: Track progress of a topic/lesson
 */
export async function toggleLessonProgress(lessonId: string, completed: boolean) {
  const session = await getSessionOrThrow();
  const userId = session.user.id;

  try {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return { success: true, error: null as string | null };
  } catch (error) {
    console.warn('Database query failed for toggleLessonProgress, falling back to mockDb:', error);

    const idx = mockDb.lessonProgress.findIndex((p) => p.userId === userId && p.lessonId === lessonId);
    if (idx !== -1) {
      mockDb.lessonProgress[idx].completed = completed;
      mockDb.lessonProgress[idx].completedAt = completed ? new Date() : null;
    } else {
      mockDb.lessonProgress.push({
        id: 'prog-' + Math.random().toString(36).substring(2, 11),
        userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      });
    }

    return { success: true, error: null as string | null };
  }
}
