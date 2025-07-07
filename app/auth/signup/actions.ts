"use server";

import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

export async function signUp(
  credentials: Partial<Record<"username" | "password", unknown>>
) {
  try {
    const { username, password } = await authSchema.parseAsync(credentials);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    });

    return { success: true, user, error: null };
  } catch (error) {
    console.error(error);

    if (error instanceof ZodError)
      return { success: false, user: null, error: error.message };

    return { success: false, user: null, error: "Failed to sign up" };
  }
}
