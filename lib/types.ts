import { Prisma } from "@prisma/client";

export type TransactionWithAccount = Prisma.TransactionGetPayload<{
  include: { account: true };
}>;

export type TransferWithAccounts = Prisma.TransferGetPayload<{
  include: { fromAccount: true; toAccount: true };
}>;

export type TransactionOrTransfer =
  | TransactionWithAccount
  | (TransferWithAccounts & { type: string });
