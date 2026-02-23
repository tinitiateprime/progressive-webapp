import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";
import { addUser, findUserByEmail, normalizeEmail, verifyPassword } from "./userStore";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = String(credentials?.password || "");

        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;

        // If user has no passwordHash (google-only), block credentials login
        if (!user.passwordHash) return null;

        const ok = verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    // ✅ When user logs in using Google, create them in your userStore if not exists
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = normalizeEmail(user?.email);
        if (!email) return false;

        const existing = await findUserByEmail(email);

        if (!existing) {
          const fullName = user?.name || "Google User";

          // random password (user won't know it; they will login via Google)
          const randomPassword = crypto.randomUUID();

          await addUser({ fullName, email, password: randomPassword });
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user?.id) token.uid = user.id;
      if (account?.provider) token.provider = account.provider;
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.uid || null;
        session.user.provider = token.provider || null;
      }
      return session;
    },
  },
};

