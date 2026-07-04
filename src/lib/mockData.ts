import bcrypt from 'bcryptjs';

// Types mimicking Prisma schema
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN';
  createdAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  instructorName: string;
  instructorBio: string;
  instructorAvatar: string;
  duration: string;
  level: string;
  createdAt: Date;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  notes: string;
  pdfUrl: string;
  order: number;
  moduleId: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: Date | null;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  transactionId: string;
  screenshotUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { name: string; email: string };
  course?: { title: string };
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply: string | null;
  status: 'PENDING' | 'REPLIED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ContactDetails {
  id: string;
  phone: string;
  whatsapp: string;
  email: string;
  telegram: string;
  instagram: string;
  youtube: string;
  facebook: string;
  upiId: string;
  upiQrCode: string;
  updatedAt: Date;
}

// Stateful In-Memory Database Store class
class MockDatabase {
  users: User[] = [];
  admins: Admin[] = [];
  courses: Course[] = [];
  modules: Module[] = [];
  lessons: Lesson[] = [];
  lessonProgress: LessonProgress[] = [];
  paymentRequests: PaymentRequest[] = [];
  enrollments: Enrollment[] = [];
  messages: Message[] = [];
  notifications: Notification[] = [];
  contactDetails: ContactDetails = {
    id: 'static',
    phone: '9894112566',
    whatsapp: '9894112566',
    email: 'dhiva2jeeva@gmail.com',
    telegram: '',
    instagram: 'dhiva__28',
    youtube: '',
    facebook: '',
    upiId: '9894112566@ybl',
    upiQrCode: '/qr_code.png',
    updatedAt: new Date(),
  };

  constructor() {
    this.reset();
  }

  reset() {
    const adminPasswordHash = bcrypt.hashSync('AdminPassword123', 10);
    const userPasswordHash = bcrypt.hashSync('UserPassword123', 10);

    // Seed default admin
    this.admins = [
      {
        id: 'admin-seed-id',
        name: 'Dhiva Admin',
        email: 'dhiva2jeeva@gmail.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        createdAt: new Date(),
      },
      {
        id: 'admin-alt-id',
        name: 'Alternate Admin',
        email: 'admin@dhivacourse.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        createdAt: new Date(),
      },
    ];

    // Seed default admin as a user too for auth compatibility
    this.users = [
      {
        id: 'admin-user-id',
        name: 'Dhiva Admin',
        email: 'dhiva2jeeva@gmail.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        createdAt: new Date(),
      },
      {
        id: 'admin-alt-user-id',
        name: 'Alternate Admin',
        email: 'admin@dhivacourse.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        createdAt: new Date(),
      },
      {
        id: 'user-seed-id',
        name: 'John User',
        email: 'user@dhivacourse.com',
        passwordHash: userPasswordHash,
        role: 'USER',
        createdAt: new Date(),
      },
    ];

    // Seed default course
    const courseId = 'nextjs-15-fullstack';
    this.courses = [
      {
        id: courseId,
        title: 'Next.js 15 Full-Stack Web Development',
        description: 'Learn to build complete production-ready web applications using Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL. We will cover server components, routing, authentication, file uploads, manual payment systems, and security in this course.',
        price: 2499,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600&auto=format&fit=crop',
        instructorName: 'Dhiva',
        instructorBio: 'Lead Full Stack developer and educator. Passionate about teaching clean code and software design patterns.',
        instructorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        duration: '40 Hours',
        level: 'All Levels',
        createdAt: new Date(),
      },
    ];

    // Seed 6 Modules & 36 Lessons
    this.modules = [];
    this.lessons = [];

    const moduleNames = [
      'Introduction & Environment Setup',
      'Core Concepts of App Router',
      'Database Integration with Prisma',
      'Authentication & Middleware',
      'Payment Processing & Server Uploads',
      'Security, Content Protection & Deployment',
    ];

    const lessonNames: { [key: number]: string[] } = {
      1: [
        'Course Overview & Goals',
        'Understanding Next.js Fullstack Architecture',
        'Setting up TypeScript & Editor Configs',
        'Introduction to Tailwind CSS v4',
        'Understanding React Server Components (RSC)',
        'Building Your First Page & Layout',
      ],
      2: [
        'Dynamic Routing & Catch-All Routes',
        'Client vs Server Components',
        'Layout Nesting & Route Groups',
        'Server Functions and Form Actions',
        'Handling Load States & Suspense',
        'Error Handling & Not Found Pages',
      ],
      3: [
        'Introduction to Prisma & ORMs',
        'Connecting PostgreSQL Database',
        'Defining Database Schemas & Relations',
        'Running Migrations & Seeding Data',
        'Performing CRUD operations in Server Components',
        'Optimizing Database Queries & Relations',
      ],
      4: [
        'Introduction to Authentication in Next.js',
        'Configuring NextAuth.js',
        'Implementing User Credentials Login & Register',
        'Role-Based Authorization & Session Management',
        'Writing Secure Auth Middleware',
        'Changing Password & Profiling',
      ],
      5: [
        'Understanding Manual Payment Architecture',
        'Configuring Cloudinary Storage Client & SDK',
        'Uploading Screenshot Receipts securely',
        'Admin Panel: Reviewing Payment Requests',
        'Auto-granting Course Access & Enrollment logic',
        'Pushing Real-Time Support Notifications',
      ],
      6: [
        'Dynamic Watermark Implementation on Lesson Views',
        'Disabling Right-Click & Copy Hotkeys',
        'Input Validation & SQL Injection Countermeasures',
        'Cross-Site Request Forgery (CSRF) Prevention',
        'Environment Variables Management',
        'Vercel Deployment Checklist & Git Pipelines',
      ],
    };

    for (let m = 1; m <= 6; m++) {
      const modId = `module-${m}`;
      this.modules.push({
        id: modId,
        title: `Module ${m}: ${moduleNames[m - 1]}`,
        order: m,
        courseId,
      });

      for (let l = 1; l <= 6; l++) {
        const lessId = `lesson-${m}-${l}`;
        const videos = [
          'https://www.youtube.com/embed/dQw4w9WgXcQ',
          'https://www.youtube.com/embed/R2_h4e_mXgI',
          'https://www.youtube.com/embed/302QGk2yW2w',
        ];
        const videoUrl = videos[(m + l) % videos.length];

        this.lessons.push({
          id: lessId,
          title: `Topic ${l}: ${lessonNames[m]?.[l - 1] || `Topic ${l}`}`,
          videoUrl,
          notes: `
            <h3>Welcome to Module ${m}, Lesson ${l}!</h3>
            <p>In this lesson, we cover the essential concepts of ${lessonNames[m]?.[l - 1] || `Topic ${l}`}.</p>
            <h4>Key Learning Objectives:</h4>
            <ul>
              <li>Understand the fundamental building blocks of this topic.</li>
              <li>Follow along with the hands-on coding demonstration.</li>
              <li>Review the attached PDF resource for extensive notes and practice challenges.</li>
            </ul>
            <h4>Summary Notes:</h4>
            <p>Always remember to write clean, typed code. When working on this section, pay close attention to safety checks, performance limits, and UX consistency.</p>
          `,
          pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          order: l,
          moduleId: modId,
        });
      }
    }

    // Clear operational lists
    this.enrollments = [];
    this.paymentRequests = [];
    this.messages = [];
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'user-seed-id',
        message: 'Welcome to DhivaCourse, John User! Search and enroll in courses to start learning.',
        isRead: false,
        createdAt: new Date(),
      }
    ];
    this.lessonProgress = [];
  }
}

// Global caching pattern for server-side state persistence
const globalForMock = global as unknown as { mockDb: MockDatabase };
export const mockDb = globalForMock.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb;
