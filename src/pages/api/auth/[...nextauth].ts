import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type NextAuthOptions, type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import {
  addUser,
  findUserByEmail,
  normalizeEmail,
  verifyPassword,
} from "../../../lib/userStore";

type AppToken = JWT & {
  id?: string;
};

type AppSession = Session & {
  user?: Session["user"] & {
    id?: string;
  };
};

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
            String(user.name || "").trim() ||
            email.split("@")[0] ||
            "Google User";

          try {
            await addUser({
              fullName,
              email,
              password: "",
            });
          } catch (error) {
            // If user was created in parallel or addUser throws,
            // allow sign-in only if the user now exists.
            const createdLater = await findUserByEmail(email);
            if (!createdLater) {
              return false;
            }
          }
        }

        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      const appToken = token as AppToken;

      if (account?.provider === "credentials" && user) {
        appToken.id = String(user.id || "");
        appToken.name = user.name || "";
        appToken.email = user.email || "";
      }

      if (account?.provider === "google") {
        const email = normalizeEmail(appToken.email || user?.email);

        if (email) {
          const existing = await findUserByEmail(email);

          if (existing) {
            appToken.id = existing.id;
            appToken.name = existing.fullName;
            appToken.email = existing.email;
          }
        }
      }

      return appToken;
    },

    async session({ session, token }) {
      const appSession = session as AppSession;
      const appToken = token as AppToken;

      if (appSession.user) {
        appSession.user.id = String(appToken.id || "");
        appSession.user.name = String(appToken.name || appSession.user.name || "");
        appSession.user.email = String(
          appToken.email || appSession.user.email || ""
        );
      }

      return appSession;
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