import { auth } from "@/lib/auth";
import { User } from "next-auth";

export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}


