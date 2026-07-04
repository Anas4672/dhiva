import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Hash passwords
  const adminPasswordHash = bcrypt.hashSync('AdminPassword123', 10);
  const userPasswordHash = bcrypt.hashSync('UserPassword123', 10);

  // 2. Create Default Admin
  const admin = await prisma.admin.upsert({
    where: { email: 'dhiva2jeeva@gmail.com' },
    update: {},
    create: {
      name: 'Dhiva Admin',
      email: 'dhiva2jeeva@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin: ${admin.email}`);

  const altAdmin = await prisma.admin.upsert({
    where: { email: 'admin@dhivacourse.com' },
    update: {},
    create: {
      name: 'Alternate Admin',
      email: 'admin@dhivacourse.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin: ${altAdmin.email}`);

  // Also upsert admin as a User just in case NextAuth matches user records
  await prisma.user.upsert({
    where: { email: 'dhiva2jeeva@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Dhiva Admin',
      email: 'dhiva2jeeva@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@dhivacourse.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Alternate Admin',
      email: 'admin@dhivacourse.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  // 3. Create Default Test User
  const user = await prisma.user.upsert({
    where: { email: 'user@dhivacourse.com' },
    update: {},
    create: {
      name: 'John User',
      email: 'user@dhivacourse.com',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });
  console.log(`Created user: ${user.email}`);

  // 4. Create Contact Details
  const contact = await prisma.contactDetails.upsert({
    where: { id: 'static' },
    update: {},
    create: {
      id: 'static',
      phone: '9894112566',
      whatsapp: '9894112566',
      email: 'dhiva2jeeva@gmail.com',
      telegram: '',
      instagram: 'dhiva__28',
      youtube: '',
      facebook: '',
      upiId: '9894112566@ybl',
      upiQrCode: '/qr_code.png', // Fallback to local scanner image
    },
  });
  console.log(`Created contact details: ${contact.phone}`);

  // 5. Create Course with 6 Modules, each containing 6 Lessons
  const courseTitle = 'Next.js 15 Full-Stack Web Development';
  const existingCourse = await prisma.course.findFirst({
    where: { title: courseTitle },
  });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        title: courseTitle,
        description: 'Learn to build complete production-ready web applications using Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL. We will cover server components, routing, authentication, file uploads, manual payment systems, and security in this course.',
        price: 2499,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600&auto=format&fit=crop',
        instructorName: 'Dhiva',
        instructorBio: 'Lead Full Stack developer and educator. Passionate about teaching clean code and software design patterns.',
        instructorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        duration: '40 Hours',
        level: 'All Levels',
      },
    });

    console.log(`Created Course: ${course.title} (${course.id})`);

    // Create 6 Modules
    for (let m = 1; m <= 6; m++) {
      const module = await prisma.module.create({
        data: {
          title: `Module ${m}: ${getModuleName(m)}`,
          order: m,
          courseId: course.id,
        },
      });

      console.log(`  Created Module: ${module.title}`);

      // Create 6 Lessons (Topics) per module
      for (let l = 1; l <= 6; l++) {
        await prisma.lesson.create({
          data: {
            title: `Topic ${l}: ${getLessonName(m, l)}`,
            videoUrl: getMockVideoUrl(m, l),
            notes: getMockNotes(m, l),
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            order: l,
            moduleId: module.id,
          },
        });
      }
      console.log(`    Added 6 lessons to ${module.title}`);
    }
  } else {
    console.log('Course already exists, skipping course seed.');
  }

  console.log('Seeding complete successfully.');
}

function getModuleName(m: number): string {
  const names = [
    'Introduction & Environment Setup',
    'Core Concepts of App Router',
    'Database Integration with Prisma',
    'Authentication & Middleware',
    'Payment Processing & Server Uploads',
    'Security, Content Protection & Deployment',
  ];
  return names[m - 1] || `Advanced Module ${m}`;
}

function getLessonName(m: number, l: number): string {
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
  return lessonNames[m]?.[l - 1] || `Topic ${l}`;
}

function getMockVideoUrl(m: number, l: number): string {
  // Let's alternate standard embeddable videos or mock links
  const videos = [
    'https://www.youtube.com/embed/dQw4w9WgXcQ', // Rickroll as a classic mock video
    'https://www.youtube.com/embed/R2_h4e_mXgI',
    'https://www.youtube.com/embed/302QGk2yW2w',
  ];
  return videos[(m + l) % videos.length];
}

function getMockNotes(m: number, l: number): string {
  return `
    <h3>Welcome to Module ${m}, Lesson ${l}!</h3>
    <p>In this lesson, we cover the essential concepts of ${getLessonName(m, l)}.</p>
    <h4>Key Learning Objectives:</h4>
    <ul>
      <li>Understand the fundamental building blocks of this topic.</li>
      <li>Follow along with the hands-on coding demonstration.</li>
      <li>Review the attached PDF resource for extensive notes and practice challenges.</li>
    </ul>
    <h4>Summary Notes:</h4>
    <p>Always remember to write clean, typed code. When working on this section, pay close attention to safety checks, performance limits, and UX consistency. Test your variables, verify your database inputs, and validate your models before shipping to production.</p>
  `;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
