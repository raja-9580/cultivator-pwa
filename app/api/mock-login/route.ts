import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';

export async function GET() {
    // ⚠️ SECURITY GUARD:
    // Must be explicitly enabled via flag
    if (process.env.NEXT_PUBLIC_MOCK_AUTH !== 'true') {
        return NextResponse.json({ error: 'Mock auth disabled' }, { status: 403 });
    }

    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

    if (!secret) {
        return NextResponse.json({ error: 'No NEXTAUTH_SECRET or AUTH_SECRET set' }, { status: 500 });
    }

    // Create a valid JWT token
    const token = await encode({
        token: {
            name: 'Test User',
            email: 'test@cultivator.app',
            picture: null,
            sub: 'mock-user-id',
        },
        secret,
    });

    const response = NextResponse.json({ success: true });

    // Set BOTH cookies to guarantee pickup on Localhost (HTTP) and Cloudflare/Ngrok (HTTPS)
    const cookieOptions = {
        httpOnly: true,
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https'),
        sameSite: 'lax' as const,
    };

    response.cookies.set('next-auth.session-token', token, cookieOptions);
    response.cookies.set('__Secure-next-auth.session-token', token, cookieOptions);

    // Flag for client to know we are ready checking
    response.cookies.set('mock-auth-ready', 'true', {
        httpOnly: false,
        path: '/',
        secure: false,
    });

    return response;
}
