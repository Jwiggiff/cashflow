import { signUp } from "@/app/auth/signup/actions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

describe("signUp", () => {
  it("creates a user with a lowercased username and hashed password", async () => {
    const result = await signUp({ username: "Alice", password: "password123" });

    expect(result.success).toBe(true);
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "alice" } });
    expect(user.password).not.toBe("password123");
    expect(await bcrypt.compare("password123", user.password)).toBe(true);
  });

  it("rejects duplicate usernames regardless of case", async () => {
    await signUp({ username: "alice", password: "password123" });

    const result = await signUp({ username: "ALICE", password: "password456" });

    expect(result).toMatchObject({ success: false, error: "Failed to sign up" });
    expect(await prisma.user.count()).toBe(1);
  });

  it("rejects short passwords", async () => {
    const result = await signUp({ username: "alice", password: "short" });

    expect(result.success).toBe(false);
    expect(await prisma.user.count()).toBe(0);
  });
});
