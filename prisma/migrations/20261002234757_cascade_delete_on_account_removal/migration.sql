-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecurringTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "rrule" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "lastProcessedDate" DATETIME,
    "nextDueDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER,
    "accountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RecurringTransaction" ("accountId", "amount", "categoryId", "createdAt", "description", "id", "isActive", "lastProcessedDate", "nextDueDate", "rrule", "startDate", "type", "updatedAt") SELECT "accountId", "amount", "categoryId", "createdAt", "description", "id", "isActive", "lastProcessedDate", "nextDueDate", "rrule", "startDate", "type", "updatedAt" FROM "RecurringTransaction";
DROP TABLE "RecurringTransaction";
ALTER TABLE "new_RecurringTransaction" RENAME TO "RecurringTransaction";
CREATE TABLE "new_RecurringTransfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "rrule" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "lastProcessedDate" DATETIME,
    "nextDueDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fromAccountId" INTEGER NOT NULL,
    "toAccountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringTransfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RecurringTransfer" ("amount", "createdAt", "description", "fromAccountId", "id", "isActive", "lastProcessedDate", "nextDueDate", "rrule", "startDate", "toAccountId", "updatedAt") SELECT "amount", "createdAt", "description", "fromAccountId", "id", "isActive", "lastProcessedDate", "nextDueDate", "rrule", "startDate", "toAccountId", "updatedAt" FROM "RecurringTransfer";
DROP TABLE "RecurringTransfer";
ALTER TABLE "new_RecurringTransfer" RENAME TO "RecurringTransfer";
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "categoryId" INTEGER,
    "accountId" INTEGER,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "categoryId", "createdAt", "date", "description", "id", "source", "type", "updatedAt", "userId") SELECT "accountId", "amount", "categoryId", "createdAt", "date", "description", "id", "source", "type", "updatedAt", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "fromAccountId" INTEGER NOT NULL,
    "toAccountId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transfer" ("amount", "createdAt", "date", "description", "fromAccountId", "id", "toAccountId", "updatedAt") SELECT "amount", "createdAt", "date", "description", "fromAccountId", "id", "toAccountId", "updatedAt" FROM "Transfer";
DROP TABLE "Transfer";
ALTER TABLE "new_Transfer" RENAME TO "Transfer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
