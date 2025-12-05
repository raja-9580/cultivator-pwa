import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    console.error("❌ MISSING GOOGLE CREDENTIALS IN .ENV FILE");
} else {
    console.log("✅ Google Credentials Loaded:");
    console.log("   Client ID starts with:", clientId.substring(0, 10) + "...");
    console.log("   Client Secret starts with:", clientSecret.substring(0, 5) + "...");
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: clientId ?? "",
            clientSecret: clientSecret ?? "",
        }),
    ],
    pages: {
        signIn: '/profile', // Redirect to profile page for sign in if needed, or default
    },
    callbacks: {
        async session({ session }) {
            return session;
        },
    },
});

export { handler as GET, handler as POST };
