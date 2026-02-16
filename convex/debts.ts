import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addDebt = mutation({
  args: {
    type: v.union(v.literal("lent"), v.literal("borrowed")),
    personName: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
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

    return await ctx.db.insert("debts", {
      userId: user._id,
      type: args.type,
      personName: args.personName,
      amount: args.amount,
      description: args.description,
      dueDate: args.dueDate,
      isCompleted: false,
    });
  },
});

export const updateDebt = mutation({
  args: {
    id: v.id("debts"),
    personName: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      personName: args.personName,
      amount: args.amount,
      description: args.description,
      dueDate: args.dueDate,
    });
  },
});

export const deleteDebt = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});

export const markComplete = mutation({
  args: {
    id: v.id("debts"),
    recordAsTransaction: v.boolean(),
    categoryId: v.optional(v.id("categories")),
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

    const debt = await ctx.db.get(args.id);
    if (!debt) throw new Error("Debt not found");

    // Mark as completed
    await ctx.db.patch(args.id, {
      isCompleted: true,
      completedDate: Date.now(),
    });

    // Optionally record as transaction
    if (args.recordAsTransaction) {
      // lent → when settled, you receive money (income)
      // borrowed → when settled, you pay money (expense)
      const txType = debt.type === "lent" ? "income" : "expense";

      // Use provided category or find a default
      let categoryId = args.categoryId;
      if (!categoryId) {
        const categories = await ctx.db
          .query("categories")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const fallback = categories.find(
          (c) =>
            c.type === txType &&
            (c.name === "Other Income" || c.name === "Other Expense")
        );
        categoryId = fallback?._id;

        if (!categoryId) {
          const any = categories.find((c) => c.type === txType);
          categoryId = any?._id;
        }
      }

      if (categoryId) {
        await ctx.db.insert("transactions", {
          userId: user._id,
          amount: debt.amount,
          type: txType,
          categoryId,
          date: Date.now(),
          description: `Debt settled: ${debt.personName}${debt.description ? ` - ${debt.description}` : ""}`,
        });
      }
    }
  },
});

export const undoComplete = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      isCompleted: false,
      completedDate: undefined,
    });
  },
});

export const getDebts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return [];

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return debts;
  },
});
