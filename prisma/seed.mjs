import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import rrule from "rrule";

const { RRule } = rrule;

const prisma = new PrismaClient();

const SEED_USERNAME = (process.env.SEED_USERNAME ?? "dev").toLowerCase();
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "devpassword";

const categoryDefinitions = [
  ["Housing", "House"],
  ["Groceries", "ShoppingCart"],
  ["Dining", "Utensils"],
  ["Utilities", "Zap"],
  ["Transportation", "Car"],
  ["Entertainment", "Clapperboard"],
  ["Health", "HeartPulse"],
  ["Shopping", "ShoppingBag"],
  ["Travel", "Plane"],
  ["Subscriptions", "Repeat"],
];

const accountDefinitions = {
  checking: {
    name: "Everyday Checking",
    type: "CHECKING",
    openingBalance: 2500,
  },
  savings: {
    name: "Emergency Savings",
    type: "SAVINGS",
    openingBalance: 8000,
  },
  investment: {
    name: "Brokerage",
    type: "INVESTMENT",
    openingBalance: 18000,
  },
  credit: {
    name: "Rewards Card",
    type: "CREDIT",
    openingBalance: 0,
  },
};

function assertLocalSeed() {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  if (isProduction || process.env.CI === "true") {
    throw new Error(
      "Development seed refused: this command may only run in a local environment."
    );
  }

  if (SEED_PASSWORD.length < 8) {
    throw new Error("SEED_PASSWORD must be at least 8 characters.");
  }
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateInMonth(monthOffset, day, now) {
  const first = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
    12
  );
  const lastDay = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  ).getDate();
  const date = new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(day, lastDay),
    12
  );

  return date <= now ? date : null;
}

function startOfMonth(monthOffset, now) {
  return new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
    12
  );
}

function endOfMonth(monthOffset, now) {
  return new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset + 1,
    0,
    12
  );
}

async function deleteExistingSeedUser(tx, userId) {
  if (!userId) return;

  const accounts = await tx.bankAccount.findMany({
    where: { userId },
    select: { id: true },
  });
  const accountIds = accounts.map(({ id }) => id);

  if (accountIds.length > 0) {
    await tx.recurringTransfer.deleteMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
    });
    await tx.transfer.deleteMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
    });
    await tx.recurringTransaction.deleteMany({
      where: { accountId: { in: accountIds } },
    });
    await tx.transaction.deleteMany({
      where: { accountId: { in: accountIds } },
    });
  }

  await tx.balanceSnapshot.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
}

function buildMonthlyRule(startDate, dayOfMonth) {
  const rule = new RRule({
    freq: RRule.MONTHLY,
    interval: 1,
    dtstart: startDate,
    bymonthday: dayOfMonth,
  });

  return {
    rrule: rule.toString(),
    lastProcessedDate: rule.before(new Date(), true),
    nextDueDate: rule.after(new Date(), false),
  };
}

async function main() {
  assertLocalSeed();

  const now = new Date();
  const categoryNames = categoryDefinitions.map(([name]) => name);
  const existingSeedUser = await prisma.user.findUnique({
    where: { username: SEED_USERNAME },
    select: { id: true },
  });
  const categoryConflicts = (
    await prisma.category.findMany({
      where: { name: { in: categoryNames } },
      select: { name: true, userId: true },
    })
  ).filter(({ userId }) => userId !== existingSeedUser?.id);

  if (categoryConflicts.length > 0) {
    throw new Error(
      `Cannot seed because these globally unique categories belong to another user: ${categoryConflicts
        .map(({ name }) => name)
        .join(", ")}`
    );
  }

  const password = await bcrypt.hash(SEED_PASSWORD, 10);

  const summary = await prisma.$transaction(async (tx) => {
    await deleteExistingSeedUser(tx, existingSeedUser?.id);

    const user = await tx.user.create({
      data: {
        username: SEED_USERNAME,
        password,
        name: "Development User",
        email: "dev@cashflow.local",
        createdAt: startOfMonth(-14, now),
      },
    });

    await tx.category.createMany({
      data: categoryDefinitions.map(([name, icon]) => ({
        name,
        icon,
        userId: user.id,
      })),
    });
    const categories = await tx.category.findMany({
      where: { userId: user.id },
    });
    const categoryIds = Object.fromEntries(
      categories.map(({ id, name }) => [name, id])
    );

    const accounts = {};
    for (const [key, definition] of Object.entries(accountDefinitions)) {
      accounts[key] = await tx.bankAccount.create({
        data: {
          name: definition.name,
          type: definition.type,
          balance: definition.openingBalance,
          userId: user.id,
          createdAt: startOfMonth(-14, now),
        },
      });
    }

    await tx.accountAlias.createMany({
      data: [
        { name: "Checking", accountId: accounts.checking.id },
        { name: "Main", accountId: accounts.checking.id },
        { name: "Savings", accountId: accounts.savings.id },
        { name: "Credit Card", accountId: accounts.credit.id },
      ],
    });

    const transactions = [];
    const transfers = [];
    const ledgerEvents = [];

    function addTransaction({
      accountKey,
      date,
      description,
      amount,
      type,
      category,
      source,
    }) {
      if (!date) return 0;

      transactions.push({
        accountId: accounts[accountKey].id,
        date,
        description,
        amount,
        type,
        categoryId: category ? categoryIds[category] : null,
        source: source ?? null,
      });
      ledgerEvents.push({
        date,
        deltas: { [accountKey]: amount },
      });

      return amount;
    }

    function addTransfer({
      fromAccountKey,
      toAccountKey,
      date,
      description,
      amount,
    }) {
      if (!date || amount <= 0) return;

      transfers.push({
        fromAccountId: accounts[fromAccountKey].id,
        toAccountId: accounts[toAccountKey].id,
        date,
        description,
        amount,
      });
      ledgerEvents.push({
        date,
        deltas: {
          [fromAccountKey]: -amount,
          [toAccountKey]: amount,
        },
      });
    }

    for (let monthOffset = -13; monthOffset <= 0; monthOffset += 1) {
      const seasonalVariance = ((monthOffset + 13) % 4) * 7;
      let creditSpending = 0;

      addTransaction({
        accountKey: "checking",
        date: dateInMonth(monthOffset, 1, now),
        description: "Acme Payroll",
        amount: 5200,
        type: "INCOME",
      });
      addTransaction({
        accountKey: "checking",
        date: dateInMonth(monthOffset, 2, now),
        description: "Monthly Rent",
        amount: -1850,
        type: "EXPENSE",
        category: "Housing",
      });
      addTransaction({
        accountKey: "checking",
        date: dateInMonth(monthOffset, 3, now),
        description: "City Transit Pass",
        amount: -125,
        type: "EXPENSE",
        category: "Transportation",
      });
      addTransaction({
        accountKey: "checking",
        date: dateInMonth(monthOffset, 8, now),
        description: "Electric Company",
        amount: -(96 + seasonalVariance),
        type: "EXPENSE",
        category: "Utilities",
      });
      addTransaction({
        accountKey: "checking",
        date: dateInMonth(monthOffset, 10, now),
        description: "Fiber Internet",
        amount: -70,
        type: "EXPENSE",
        category: "Utilities",
      });
      addTransaction({
        accountKey: "savings",
        date: dateInMonth(monthOffset, 25, now),
        description: "Savings Interest",
        amount: 18.25,
        type: "INCOME",
      });

      creditSpending += Math.abs(
        addTransaction({
          accountKey: "credit",
          date: dateInMonth(monthOffset, 5, now),
          description: "Greenway Market",
          amount: -(118 + seasonalVariance),
          type: "EXPENSE",
          category: "Groceries",
          source:
            monthOffset === 0
              ? "https://receipts.example/greenway-latest"
              : null,
        })
      );
      creditSpending += Math.abs(
        addTransaction({
          accountKey: "credit",
          date: dateInMonth(monthOffset, 7, now),
          description: "Neighborhood Bistro",
          amount: -54.8,
          type: "EXPENSE",
          category: "Dining",
        })
      );
      creditSpending += Math.abs(
        addTransaction({
          accountKey: "credit",
          date: dateInMonth(monthOffset, 11, now),
          description: "StreamFlix",
          amount: -15.99,
          type: "EXPENSE",
          category: "Subscriptions",
        })
      );
      creditSpending += Math.abs(
        addTransaction({
          accountKey: "credit",
          date: dateInMonth(monthOffset, 14, now),
          description: "Home Supply Store",
          amount: -(42.5 + seasonalVariance),
          type: "EXPENSE",
          category: "Shopping",
        })
      );
      creditSpending += Math.abs(
        addTransaction({
          accountKey: "credit",
          date: dateInMonth(monthOffset, 19, now),
          description: "Fresh Foods",
          amount: -86.35,
          type: "EXPENSE",
          category: "Groceries",
        })
      );
      creditSpending += Math.abs(
        addTransaction({
          accountKey: "credit",
          date: dateInMonth(monthOffset, 21, now),
          description: "Taco Garden",
          amount: -31.2,
          type: "EXPENSE",
          category: "Dining",
        })
      );

      if (monthOffset === -4) {
        creditSpending += Math.abs(
          addTransaction({
            accountKey: "credit",
            date: dateInMonth(monthOffset, 20, now),
            description: "Coastal Air",
            amount: -438.6,
            type: "EXPENSE",
            category: "Travel",
          })
        );
      }

      if (monthOffset % 3 === 0) {
        addTransaction({
          accountKey: "checking",
          date: dateInMonth(monthOffset, 17, now),
          description: "Freelance Project",
          amount: 650,
          type: "INCOME",
        });
      }

      addTransfer({
        fromAccountKey: "checking",
        toAccountKey: "savings",
        date: dateInMonth(monthOffset, 4, now),
        description: "Monthly Savings",
        amount: 700,
      });
      addTransfer({
        fromAccountKey: "checking",
        toAccountKey: "investment",
        date: dateInMonth(monthOffset, 6, now),
        description: "Monthly Investment",
        amount: 300,
      });
      addTransfer({
        fromAccountKey: "checking",
        toAccountKey: "credit",
        date: dateInMonth(monthOffset, 28, now),
        description: "Credit Card Payment",
        amount: roundMoney(creditSpending),
      });
    }

    addTransaction({
      accountKey: "checking",
      date: dateInMonth(0, Math.min(now.getDate(), 16), now),
      description: "Cash Withdrawal",
      amount: -60,
      type: "EXPENSE",
    });

    await tx.transaction.createMany({ data: transactions });
    await tx.transfer.createMany({ data: transfers });

    const balances = Object.fromEntries(
      Object.entries(accountDefinitions).map(([key, definition]) => [
        key,
        definition.openingBalance,
      ])
    );
    for (const event of ledgerEvents.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )) {
      for (const [accountKey, delta] of Object.entries(event.deltas)) {
        balances[accountKey] = roundMoney(balances[accountKey] + delta);
      }
    }

    for (const [accountKey, balance] of Object.entries(balances)) {
      await tx.bankAccount.update({
        where: { id: accounts[accountKey].id },
        data: { balance },
      });
    }

    await tx.balanceSnapshot.deleteMany({ where: { userId: user.id } });

    const snapshots = [];
    const snapshotBalances = Object.fromEntries(
      Object.entries(accountDefinitions).map(([key, definition]) => [
        key,
        definition.openingBalance,
      ])
    );
    const sortedEvents = [...ledgerEvents].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    let eventIndex = 0;
    const snapshotDates = [
      startOfMonth(-14, now),
      ...Array.from({ length: 13 }, (_, index) =>
        endOfMonth(index - 13, now)
      ),
      now,
    ];

    for (const recordedAt of snapshotDates) {
      while (
        eventIndex < sortedEvents.length &&
        sortedEvents[eventIndex].date <= recordedAt
      ) {
        for (const [accountKey, delta] of Object.entries(
          sortedEvents[eventIndex].deltas
        )) {
          snapshotBalances[accountKey] = roundMoney(
            snapshotBalances[accountKey] + delta
          );
        }
        eventIndex += 1;
      }

      for (const [accountKey, balance] of Object.entries(snapshotBalances)) {
        snapshots.push({
          accountId: accounts[accountKey].id,
          userId: user.id,
          recordedAt,
          balance,
        });
      }
    }

    await tx.balanceSnapshot.createMany({ data: snapshots });

    const recurringStart = dateInMonth(-13, 1, now);
    const salaryRule = buildMonthlyRule(recurringStart, 1);
    const rentRule = buildMonthlyRule(recurringStart, 2);
    const savingsRule = buildMonthlyRule(recurringStart, 4);

    await tx.recurringTransaction.createMany({
      data: [
        {
          accountId: accounts.checking.id,
          description: "Acme Payroll",
          amount: 5200,
          type: "INCOME",
          startDate: recurringStart,
          ...salaryRule,
        },
        {
          accountId: accounts.checking.id,
          categoryId: categoryIds.Housing,
          description: "Monthly Rent",
          amount: -1850,
          type: "EXPENSE",
          startDate: recurringStart,
          ...rentRule,
        },
      ],
    });
    await tx.recurringTransfer.create({
      data: {
        fromAccountId: accounts.checking.id,
        toAccountId: accounts.savings.id,
        description: "Monthly Savings",
        amount: 700,
        startDate: recurringStart,
        ...savingsRule,
      },
    });

    return {
      accounts: Object.keys(accounts).length,
      categories: categories.length,
      transactions: transactions.length,
      transfers: transfers.length,
      snapshots: snapshots.length,
    };
  });

  console.log(`Local development data seeded for "${SEED_USERNAME}".`);
  console.log(`Login: ${SEED_USERNAME} / ${SEED_PASSWORD}`);
  console.log(summary);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
