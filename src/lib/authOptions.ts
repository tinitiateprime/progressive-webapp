// src/lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import type { Account, Profile, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

import { addUser, findUserByEmail, normalizeEmail, verifyPassword } from "./userStore";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

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
        if (!user || !user.passwordHash) return null;

        const ok = verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.fullName, email: user.email };
      },
    }),
  ],

  callbacks: {
    // ✅ FIXED: typed params
    async signIn({
      user,
      account,
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
    }) {
      if (account?.provider === "google") {
        const email = normalizeEmail(user?.email);
        if (!email) return false;

        const existing = await findUserByEmail(email);

        if (!existing) {
          const fullName = user?.name || "Google User";
          const randomPassword = crypto.randomUUID(); // user won’t use this

          await addUser({ fullName, email, password: randomPassword });
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user?.id) (token as any).uid = user.id;
      if (account?.provider) (token as any).provider = account.provider;
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = (token as any).uid || null;
        (session.user as any).provider = (token as any).provider || null;
      }
      return session;
    },
  },
};
