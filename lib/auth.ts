import NextAuth, { type DefaultSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "./zod";
import { ZodError } from "zod";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      email?: string;
      name?: string;
    };
  }
  interface User {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { username, password } = await signInSchema.parseAsync(
            credentials
          );

          // Find user by username
          const user = await prisma.user.findUnique({
            where: {
              username,
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
          if (error instanceof ZodError) return null;
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
});
