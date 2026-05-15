import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { addUser, findUserByEmail, normalizeEmail, verifyPassword } from "./userStore";

type AppToken = JWT & {
  id?: string;
  picture?: string | null;
};

type AppSession = Session & {
  user?: Session["user"] & {
    id?: string;
  };
};

const AUTH_FALLBACK_SECRET = "tinitiate-local-auth-secret-v1";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

const firstEnvValue = (...names: string[]) => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return "";
};

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET =
    firstEnvValue("AUTH_SECRET", "NEXTAUTH_SECRET") || AUTH_FALLBACK_SECRET;
}

const getGoogleClientId = () =>
  firstEnvValue(
    "GOOGLE_CLIENT_ID",
    "GOOGLE_ID",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_CLIENT_ID",
    "NEXTAUTH_GOOGLE_CLIENT_ID"
  );

const getGoogleClientSecret = () =>
  firstEnvValue(
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_SECRET",
    "AUTH_GOOGLE_SECRET",
    "AUTH_GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_GOOGLE_CLIENT_SECRET"
  );

export const isGoogleAuthConfigured = () =>
  Boolean(getGoogleClientId() && getGoogleClientSecret());

const googleProvider = () =>
  GoogleProvider({
    clientId: getGoogleClientId(),
    clientSecret: getGoogleClientSecret(),
    authorization: {
      params: {
        prompt: "select_account",
        access_type: "offline",
        response_type: "code",
      },
    },
  });

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || AUTH_FALLBACK_SECRET,

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: SESSION_MAX_AGE,
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
          image: null,
        };
      },
    }),

    ...(isGoogleAuthConfigured() ? [googleProvider()] : []),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = normalizeEmail(user.email);

      if (!email) {
        return false;
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return true;
      }

      const fullName = String(user.name || "").trim() || email.split("@")[0] || "Google User";
      const created = await addUser({ fullName, email });

      if (created.ok) {
        return true;
      }

      const createdLater = await findUserByEmail(email);
      return Boolean(createdLater);
    },

    async jwt({ token, user, account }) {
      const appToken = token as AppToken;

      if (account?.provider === "credentials" && user) {
        appToken.id = String(user.id || "");
        appToken.name = user.name || "";
        appToken.email = user.email || "";
        appToken.picture = null;
      }

      if (account?.provider === "google") {
        const email = normalizeEmail(appToken.email || user?.email);
        appToken.picture =
          typeof user?.image === "string"
            ? user.image
            : typeof appToken.picture === "string"
              ? appToken.picture
              : null;

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
        appSession.user.email = String(appToken.email || appSession.user.email || "");
        appSession.user.image =
          typeof appToken.picture === "string"
            ? appToken.picture
            : typeof appSession.user.image === "string"
              ? appSession.user.image
              : null;
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
