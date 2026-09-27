import { POST } from "@/app/api/transactions/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { balanceOf, createAccountFor } from "./helpers";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";

function post(body: unknown, auth?: string) {
  return POST(
    new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(auth ? { authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    })
  );
}

const basic = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

describe("POST /api/transactions", () => {
  let user: User;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: { username: "alice", password: await bcrypt.hash("password123", 4) },
    });
  });

  it("requires basic auth", async () => {
    expect((await post({})).status).toBe(401);
    expect((await post({}, basic("alice", "wrong-password"))).status).toBe(401);
  });

  it("validates the body", async () => {
    const res = await post({ description: "", amount: -1 }, basic("alice", "password123"));

    expect(res.status).toBe(400);
  });

  it("creates an expense by account alias and updates the balance", async () => {
    const account = await createAccountFor(user, { balance: 100 });
    await prisma.accountAlias.create({ data: { name: "chk", accountId: account.id } });

    const res = await post(
      { description: "Lunch", amount: 12.5, type: "EXPENSE", account: "chk" },
      basic("alice", "password123")
    );

    expect(res.status).toBe(201);
    expect((await res.json()).data).toMatchObject({ amount: -12.5, accountId: account.id });
    expect(await balanceOf(account.id)).toBe(87.5);
  });

  it("returns 404 for unknown accounts and categories", async () => {
    await createAccountFor(user);
    const auth = basic("alice", "password123");

    const noAccount = await post({ description: "x", amount: 1, type: "EXPENSE", account: "Nope" }, auth);
    const noCategory = await post(
      { description: "x", amount: 1, type: "EXPENSE", account: "Checking", category: "Nope" },
      auth
    );

    expect(noAccount.status).toBe(404);
    expect(noCategory.status).toBe(404);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it("cannot post to another user's account", async () => {
    const bob = await prisma.user.create({
      data: { username: "bob", password: await bcrypt.hash("password123", 4) },
    });
    await createAccountFor(bob, { name: "Bob Checking" });

    const res = await post(
      { description: "x", amount: 1, type: "INCOME", account: "Bob Checking" },
      basic("alice", "password123")
    );

    expect(res.status).toBe(404);
  });
});
