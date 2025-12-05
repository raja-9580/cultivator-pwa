import { withAuth } from "next-auth/middleware"

export default withAuth({
    // Matches the pages config in `[...nextauth]`
    pages: {
        signIn: '/profile',
    },
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - profile (the login page itself, to avoid redirect loops)
         * - icons (PWA icons)
         * - manifest.json (PWA manifest)
         * - sw.js (Service Worker)
         * - workbox-*.js (Workbox scripts)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|profile|icons|images|manifest.json|sw.js|workbox-.*).*)",
    ]
}
