// pages/api/auth/nextauth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // stores session in JWT (can use cookies)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      // store additional info in session if needed
      (session.user as any).id = token.sub;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
