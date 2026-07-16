-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "balance" REAL NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" INTEGER NOT NULL,
    CONSTRAINT "BalanceSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BalanceSnapshot_accountId_recordedAt_idx" ON "BalanceSnapshot"("accountId", "recordedAt");

-- Capture a baseline for accounts that predate balance history.
INSERT INTO "BalanceSnapshot" ("balance", "accountId", "recordedAt")
SELECT "balance", "id", CURRENT_TIMESTAMP
FROM "BankAccount";

-- Record every new account's initial balance.
CREATE TRIGGER "BankAccount_balance_snapshot_after_insert"
AFTER INSERT ON "BankAccount"
BEGIN
    INSERT INTO "BalanceSnapshot" ("balance", "accountId")
    VALUES (NEW."balance", NEW."id");
END;

-- Record all balance changes, including balances entered manually.
CREATE TRIGGER "BankAccount_balance_snapshot_after_update"
AFTER UPDATE OF "balance" ON "BankAccount"
WHEN OLD."balance" IS NOT NEW."balance"
BEGIN
    INSERT INTO "BalanceSnapshot" ("balance", "accountId")
    VALUES (NEW."balance", NEW."id");
END;
