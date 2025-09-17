import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Passkey from "next-auth/providers/passkey";
import { authSchema } from "./zod";

declare module "next-auth" {
  interface User {
    /** The user's id. */
    id: string;
    /** The user's username. */
    username: string;
    /** The user's email. */
    email: string | null;
    /** The user's name. */
    name: string | null;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** The user's id. */
    id: string;
    /** The user's username. */
    username: string;
    /** The user's email. */
    email: string | null;
    /** The user's name. */
    name: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { username, password } = await authSchema.parseAsync(
            credentials
          );

          // Find user by username
          const user = await prisma.user.findUnique({
            where: {
              username: username.toLowerCase(),
            },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Error signing in", error);
          return null;
        }
      },
    }),
    Passkey,
  ],
  experimental: { enableWebAuthn: true },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour in seconds
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour in seconds
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.name = user.name;
      }
      if (trigger === "update") {
        token.id = session.user.id;
        token.username = session.user.username;
        token.email = session.user.email;
        token.name = session.user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email || "";
        session.user.name = token.name;
      }
      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
