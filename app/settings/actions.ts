"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/zod";
import { ZodError } from "zod";

export async function updateProfile(data: {
  username?: string;
  name?: string;
  email?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { username, name, email } = profileSchema.parse(data);

    // Check if email is already taken by another user
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return { success: false, error: "Email is already taken" };
      }
    }

    // Check if username is already taken by another user
    if (username && username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return { success: false, error: "Username is already taken" };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email, username },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    };
  } catch (error) {
    console.error("Failed to update profile:", error);

    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    return { success: false, error: "Failed to update profile" };
  }
}
