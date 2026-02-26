import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import {
  addUser,
  findUserByEmail,
  normalizeEmail,
  verifyPassword,
} from "../../../lib/userStore";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = String(credentials?.password || "");

        if (!email || !password) {
          throw new Error("Please enter email and password.");
        }

        const user = await findUserByEmail(email);

        if (!user) {
          throw new Error("No account found. Please sign up first.");
        }

        // Google-only account
        if (!user.passwordHash) {
          throw new Error("Please sign in with Google.");
        }

        const ok = verifyPassword(password, user.passwordHash);

        if (!ok) {
          throw new Error("Invalid credentials.");
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (account?.provider === "google") {
        const email = normalizeEmail(user.email);

        if (!email) {
          return false;
        }

        const existing = await findUserByEmail(email);

        if (!existing) {
          const fullName =
            String(user.name || "").trim() || email.split("@")[0] || "Google User";

          const created = await addUser({
            fullName,
            email,
            password: "",
          });

          if (!created.ok && created.message !== "User already exists") {
            return false;
          }
        }

        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      if (account?.provider === "google") {
        const email = normalizeEmail(token.email || user?.email);

        if (email) {
          const existing = await findUserByEmail(email);

          if (existing) {
            token.id = existing.id;
            token.name = existing.fullName;
            token.email = existing.email;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.name = String(token.name || session.user.name || "");
        session.user.email = String(token.email || session.user.email || "");
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}