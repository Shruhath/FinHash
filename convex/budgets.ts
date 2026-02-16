import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addBudget = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    month: v.string(),
    isRecurring: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    // Check if budget already exists for this category+month
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month)
      )
      .collect();

    const duplicate = existing.find((b) => b.categoryId === args.categoryId);
    if (duplicate) {
      // Update existing instead
      await ctx.db.patch(duplicate._id, {
        amount: args.amount,
        isRecurring: args.isRecurring,
      });
      return duplicate._id;
    }

    return await ctx.db.insert("budgets", {
      userId: user._id,
      categoryId: args.categoryId,
      amount: args.amount,
      month: args.month,
      isRecurring: args.isRecurring,
    });
  },
});

export const updateBudget = mutation({
  args: {
    id: v.id("budgets"),
    amount: v.number(),
    isRecurring: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      amount: args.amount,
      isRecurring: args.isRecurring,
    });
  },
});

export const deleteBudget = mutation({
  args: {
    id: v.id("budgets"),
    deleteAllFuture: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const budget = await ctx.db.get(args.id);
    if (!budget) return;

    await ctx.db.delete(args.id);

    // If deleting all future recurring budgets for this category
    if (args.deleteAllFuture && budget.isRecurring) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (!user) return;

      const allBudgets = await ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const b of allBudgets) {
        if (
          b.categoryId === budget.categoryId &&
          b.month > budget.month
        ) {
          await ctx.db.delete(b._id);
        }
      }
    }
  },
});

export const getBudgetsWithSpending = query({
  args: { month: v.string() },
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

    // Get budgets for this month
    let budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", user._id).eq("month", args.month)
      )
      .collect();

    // If no budgets for this month, check for recurring budgets from previous months
    if (budgets.length === 0) {
      const allBudgets = await ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const recurringBudgets = allBudgets.filter(
        (b) => b.isRecurring && b.month < args.month
      );

      // Get the latest recurring budget per category
      const latestPerCategory: Record<string, typeof recurringBudgets[number]> = {};
      for (const b of recurringBudgets) {
        const existing = latestPerCategory[b.categoryId];
        if (!existing || b.month > existing.month) {
          latestPerCategory[b.categoryId] = b;
        }
      }

      // Return recurring budgets as virtual entries for this month
      for (const b of Object.values(latestPerCategory)) {
        budgets.push({
          ...b,
          month: args.month,
        });
      }
    }

    // Get transactions for this month to calculate spending
    const [yearStr, monthStr] = args.month.split("-");
    const year = parseInt(yearStr!);
    const month = parseInt(monthStr!) - 1;
    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate)
      )
      .collect();

    const filtered = transactions.filter(
      (t) => t.date <= endDate && t.type === "expense"
    );

    // Sum spending per category
    const spendingByCategory: Record<string, number> = {};
    for (const t of filtered) {
      spendingByCategory[t.categoryId] =
        (spendingByCategory[t.categoryId] ?? 0) + t.amount;
    }

    // Get category details
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    return budgets.map((b) => {
      const category = categoryMap.get(b.categoryId);
      const spent = spendingByCategory[b.categoryId] ?? 0;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      return {
        _id: b._id,
        categoryId: b.categoryId,
        categoryName: category?.name ?? "Unknown",
        categoryColor: category?.color ?? "#71717a",
        categoryIcon: category?.icon ?? "Circle",
        budgetAmount: b.amount,
        spent,
        percentage,
        isRecurring: b.isRecurring,
        status:
          percentage >= 100
            ? ("exceeded" as const)
            : percentage >= 75
              ? ("warning" as const)
              : ("safe" as const),
      };
    });
  },
});
