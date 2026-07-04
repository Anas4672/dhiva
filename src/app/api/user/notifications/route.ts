import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let notifications = [];
    try {
      notifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });
    } catch (error) {
      console.warn('Database query failed for notifications API, falling back to mockDb:', error);
      notifications = mockDb.notifications
        .filter((n) => n.userId === session.user.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20);
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Failed to fetch user notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
