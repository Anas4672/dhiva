import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 1. Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if user already exists
    let existingUser = null;
    let existingAdmin = null;
    let dbFailed = false;

    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      existingAdmin = await prisma.admin.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (error) {
      console.warn('Database query failed during register, checking mockDb:', error);
      dbFailed = true;
      existingUser = mockDb.users.find((u) => u.email === normalizedEmail) || null;
      existingAdmin = mockDb.admins.find((a) => a.email === normalizedEmail) || null;
    }

    if (existingUser || existingAdmin) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // 4. Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // 5. Create user
    let newUser = null;

    if (dbFailed) {
      newUser = {
        id: 'user-' + Math.random().toString(36).substring(2, 11),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER' as const,
        createdAt: new Date(),
      };
      mockDb.users.push(newUser);
      mockDb.notifications.push({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: newUser.id,
        message: `Welcome to DhivaCourse, ${newUser.name}! Search and enroll in courses to start learning.`,
        isRead: false,
        createdAt: new Date(),
      });
    } else {
      try {
        const dbUser = await prisma.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'USER',
          },
        });
        newUser = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          createdAt: dbUser.createdAt,
        };

        // Create a welcome notification
        await prisma.notification.create({
          data: {
            userId: newUser.id,
            message: `Welcome to DhivaCourse, ${newUser.name}! Search and enroll in courses to start learning.`,
          },
        });
      } catch (error) {
        console.warn('DB create failed during register, falling back to mockDb:', error);
        newUser = {
          id: 'user-' + Math.random().toString(36).substring(2, 11),
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'USER' as const,
          createdAt: new Date(),
        };
        mockDb.users.push(newUser);
        mockDb.notifications.push({
          id: 'notif-' + Math.random().toString(36).substring(2, 11),
          userId: newUser.id,
          message: `Welcome to DhivaCourse, ${newUser.name}! Search and enroll in courses to start learning.`,
          isRead: false,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json(
      { message: 'User registered successfully', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
