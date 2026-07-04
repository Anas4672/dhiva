import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { mockDb } from './mockData';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password');
        }

        const emailClean = credentials.email.toLowerCase().trim();
        let admin = null;
        let dbFailed = false;

        // 1. Check if email belongs to an Admin
        try {
          admin = await prisma.admin.findUnique({
            where: { email: emailClean },
          });
        } catch (error) {
          console.warn('Database query failed, falling back to mockDb for admin:', error);
          dbFailed = true;
          admin = mockDb.admins.find((a) => a.email.toLowerCase() === emailClean) || null;
        }

        if (admin) {
          const isValid = bcrypt.compareSync(credentials.password, admin.passwordHash);
          if (!isValid) {
            throw new Error('Invalid email or password');
          }
          return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'ADMIN',
          };
        }

        // 2. Check if email belongs to a standard User
        let user = null;
        if (dbFailed) {
          user = mockDb.users.find((u) => u.email.toLowerCase() === emailClean) || null;
        } else {
          try {
            user = await prisma.user.findUnique({
              where: { email: emailClean },
            });
          } catch (error) {
            console.warn('Database query failed, falling back to mockDb for user:', error);
            user = mockDb.users.find((u) => u.email.toLowerCase() === emailClean) || null;
          }
        }

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isValid = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
      }
      
      // Support dynamic session updates (e.g. user updating their profile)
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
        if (session.role) token.role = session.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
