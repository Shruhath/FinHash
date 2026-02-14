import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper: get authenticated user
async function getAuthUser(ctx: { auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) throw new Error("User not found");
  return user;
}

export const addTransaction = mutation({
  args: {
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.id("categories"),
    date: v.number(),
    description: v.optional(v.string()),
    goalId: v.optional(v.id("savings_goals")),
    isRecurring: v.optional(v.boolean()),
    recurringFrequency: v.optional(
      v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    return await ctx.db.insert("transactions", {
      userId: user._id,
      amount: args.amount,
      type: args.type,
      categoryId: args.categoryId,
      date: args.date,
      description: args.description,
      goalId: args.goalId,
      isRecurring: args.isRecurring,
      recurringFrequency: args.recurringFrequency,
    });
  },
});

export const splitTransaction = mutation({
  args: {
    splits: v.array(
      v.object({
        amount: v.number(),
        categoryId: v.id("categories"),
        description: v.optional(v.string()),
      })
    ),
    date: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const splitGroupId = crypto.randomUUID();

    const ids = [];
    for (const split of args.splits) {
      const id = await ctx.db.insert("transactions", {
        userId: user._id,
        amount: split.amount,
        type: args.type,
        categoryId: split.categoryId,
        date: args.date,
        description: split.description,
        splitGroupId,
      });
      ids.push(id);
    }

    return { splitGroupId, transactionIds: ids };
  },
});

export const editTransaction = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.id("categories"),
    date: v.number(),
    description: v.optional(v.string()),
    goalId: v.optional(v.id("savings_goals")),
  },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);

    await ctx.db.patch(args.id, {
      amount: args.amount,
      type: args.type,
      categoryId: args.categoryId,
      date: args.date,
      description: args.description,
      goalId: args.goalId,
    });
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getTransactions = query({
  args: {
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        args.startDate !== undefined
          ? q.eq("userId", user._id).gte("date", args.startDate)
          : q.eq("userId", user._id)
      )
      .collect();

    // Apply end date filter
    if (args.endDate !== undefined) {
      transactions = transactions.filter((t) => t.date <= args.endDate!);
    }

    // Apply type filter
    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    // Sort descending by date
    transactions.sort((a, b) => b.date - a.date);

    return transactions;
  },
});

export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 10);

    return transactions;
  },
});

export const getMonthlySummary = query({
  args: {
    month: v.number(), // 0-11
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const startDate = new Date(args.year, args.month, 1).getTime();
    const endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate)
      )
      .collect();

    const filtered = transactions.filter((t) => t.date <= endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending: Record<string, number> = {};

    for (const t of filtered) {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        const catId = t.categoryId;
        categorySpending[catId] = (categorySpending[catId] ?? 0) + t.amount;
      }
    }

    const daysInMonth = new Date(args.year, args.month + 1, 0).getDate();
    const currentDay = new Date().getMonth() === args.month && new Date().getFullYear() === args.year
      ? new Date().getDate()
      : daysInMonth;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: filtered.length,
      avgDailySpend: currentDay > 0 ? totalExpense / currentDay : 0,
      savingsRate: totalIncome > 0
        ? ((totalIncome - totalExpense) / totalIncome) * 100
        : 0,
      categorySpending,
    };
  },
});

export const getYearlySummary = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const startDate = new Date(args.year, 0, 1).getTime();
    const endDate = new Date(args.year, 11, 31, 23, 59, 59, 999).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate)
      )
      .collect();

    const filtered = transactions.filter((t) => t.date <= endDate);

    // Monthly breakdown
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      income: 0,
      expense: 0,
      balance: 0,
    }));

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending: Record<string, number> = {};

    for (const t of filtered) {
      const d = new Date(t.date);
      const m = d.getMonth();
      if (t.type === "income") {
        months[m]!.income += t.amount;
        totalIncome += t.amount;
      } else {
        months[m]!.expense += t.amount;
        totalExpense += t.amount;
        categorySpending[t.categoryId] =
          (categorySpending[t.categoryId] ?? 0) + t.amount;
      }
      months[m]!.balance = months[m]!.income - months[m]!.expense;
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: filtered.length,
      savingsRate:
        totalIncome > 0
          ? ((totalIncome - totalExpense) / totalIncome) * 100
          : 0,
      months,
      categorySpending,
    };
  },
});

export const getAllTimeSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let totalIncome = 0;
    let totalExpense = 0;
    let firstDate: number | null = null;
    const categorySpending: Record<string, number> = {};
    const yearlyData: Record<number, { income: number; expense: number; balance: number }> = {};

    for (const t of transactions) {
      if (firstDate === null || t.date < firstDate) {
        firstDate = t.date;
      }

      const year = new Date(t.date).getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = { income: 0, expense: 0, balance: 0 };
      }

      if (t.type === "income") {
        totalIncome += t.amount;
        yearlyData[year]!.income += t.amount;
      } else {
        totalExpense += t.amount;
        yearlyData[year]!.expense += t.amount;
        categorySpending[t.categoryId] =
          (categorySpending[t.categoryId] ?? 0) + t.amount;
      }
      yearlyData[year]!.balance =
        yearlyData[year]!.income - yearlyData[year]!.expense;
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      savingsRate:
        totalIncome > 0
          ? ((totalIncome - totalExpense) / totalIncome) * 100
          : 0,
      firstTransactionDate: firstDate,
      categorySpending,
      yearlyData,
    };
  },
});
