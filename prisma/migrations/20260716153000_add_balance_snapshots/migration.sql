-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "balance" REAL NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "accountId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "BalanceSnapshot_accountId_recordedAt_idx" ON "BalanceSnapshot"("accountId", "recordedAt");

-- CreateIndex
CREATE INDEX "BalanceSnapshot_userId_recordedAt_idx" ON "BalanceSnapshot"("userId", "recordedAt");

-- Capture a baseline for accounts that predate balance history.
INSERT INTO "BalanceSnapshot" ("balance", "accountId", "userId", "recordedAt")
SELECT
    "balance",
    "id",
    "userId",
    CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
FROM "BankAccount";

-- Record every new account's initial balance.
CREATE TRIGGER "BankAccount_balance_snapshot_after_insert"
AFTER INSERT ON "BankAccount"
BEGIN
    INSERT INTO "BalanceSnapshot" ("balance", "accountId", "userId", "recordedAt")
    VALUES (
        NEW."balance",
        NEW."id",
        NEW."userId",
        CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
    );
END;

-- Record all balance changes, including balances entered manually.
CREATE TRIGGER "BankAccount_balance_snapshot_after_update"
AFTER UPDATE OF "balance" ON "BankAccount"
WHEN OLD."balance" IS NOT NEW."balance"
BEGIN
    INSERT INTO "BalanceSnapshot" ("balance", "accountId", "userId", "recordedAt")
    VALUES (
        NEW."balance",
        NEW."id",
        NEW."userId",
        CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
    );
END;

-- Keep prior net worth intact when an account is deleted, then stop carrying
-- that account's last balance forward.
CREATE TRIGGER "BankAccount_balance_snapshot_after_delete"
AFTER DELETE ON "BankAccount"
BEGIN
    INSERT INTO "BalanceSnapshot" ("balance", "accountId", "userId", "recordedAt")
    VALUES (
        0,
        OLD."id",
        OLD."userId",
        CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
    );
END;

-- Balance history is retained for account deletion, but not user deletion.
CREATE TRIGGER "User_balance_snapshots_after_delete"
AFTER DELETE ON "User"
BEGIN
    DELETE FROM "BalanceSnapshot" WHERE "userId" = OLD."id";
END;
