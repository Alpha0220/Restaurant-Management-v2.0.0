
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check disable status
    if (user.disable) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
    }

    // Direct password comparison as requested (NOT SECURE)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // In a real app, we would set a session/cookie here. 
    // For now, we return success and let the client handle strict redirection or state.
    // Minimally returning user info (excluding password).
    const { password: _, ...userInfo } = user;

    const response = NextResponse.json({ success: true, user: userInfo });

    // Set cookie for middleware
    response.cookies.set({
      name: 'auth_session',
      value: String(user.id), // Storing user ID in cookie
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
