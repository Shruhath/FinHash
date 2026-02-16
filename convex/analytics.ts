import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAnalyticsData = query({
  args: {
    months: v.number(), // how many months back to look
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

    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - args.months + 1,
      1
    ).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate)
      )
      .collect();

    // --- Monthly trend data ---
    const monthlyTrend: {
      month: string;
      monthLabel: string;
      income: number;
      expense: number;
      balance: number;
    }[] = [];

    for (let i = args.months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
      monthlyTrend.push({
        month: monthKey,
        monthLabel,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    // --- Category breakdown ---
    const categorySpending: Record<
      string,
      { amount: number; count: number }
    > = {};
    const categoryIncome: Record<
      string,
      { amount: number; count: number }
    > = {};

    for (const t of transactions) {
      const d = new Date(t.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const trendEntry = monthlyTrend.find((m) => m.month === monthKey);

      if (t.type === "income") {
        if (trendEntry) {
          trendEntry.income += t.amount;
          trendEntry.balance = trendEntry.income - trendEntry.expense;
        }
        if (!categoryIncome[t.categoryId]) {
          categoryIncome[t.categoryId] = { amount: 0, count: 0 };
        }
        categoryIncome[t.categoryId]!.amount += t.amount;
        categoryIncome[t.categoryId]!.count += 1;
      } else {
        if (trendEntry) {
          trendEntry.expense += t.amount;
          trendEntry.balance = trendEntry.income - trendEntry.expense;
        }
        if (!categorySpending[t.categoryId]) {
          categorySpending[t.categoryId] = { amount: 0, count: 0 };
        }
        categorySpending[t.categoryId]!.amount += t.amount;
        categorySpending[t.categoryId]!.count += 1;
      }
    }

    // Get category details
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    const expenseByCategory = Object.entries(categorySpending)
      .map(([catId, data]) => {
        const cat = categoryMap.get(catId as any);
        return {
          categoryId: catId,
          name: cat?.name ?? "Unknown",
          color: cat?.color ?? "#71717a",
          icon: cat?.icon ?? "Circle",
          amount: data.amount,
          count: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const incomeByCategory = Object.entries(categoryIncome)
      .map(([catId, data]) => {
        const cat = categoryMap.get(catId as any);
        return {
          categoryId: catId,
          name: cat?.name ?? "Unknown",
          color: cat?.color ?? "#71717a",
          amount: data.amount,
          count: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Totals
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    return {
      monthlyTrend,
      expenseByCategory,
      incomeByCategory,
      totalIncome,
      totalExpense,
      totalTransactions: transactions.length,
    };
  },
});
