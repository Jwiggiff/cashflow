import { Prisma } from "@prisma/client";

export type TransactionWithAccount = Prisma.TransactionGetPayload<{
  include: { account: true };
}>; 