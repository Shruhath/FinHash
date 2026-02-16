import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.number(),
    description: v.optional(v.string()),
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

    return await ctx.db.insert("savings_goals", {
      userId: user._id,
      name: args.name,
      targetAmount: args.targetAmount,
      targetDate: args.targetDate,
      description: args.description,
    });
  },
});

export const updateGoal = mutation({
  args: {
    id: v.id("savings_goals"),
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      name: args.name,
      targetAmount: args.targetAmount,
      targetDate: args.targetDate,
      description: args.description,
    });
  },
});

export const deleteGoal = mutation({
  args: { id: v.id("savings_goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});

export const getGoalsWithProgress = query({
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

    const goals = await ctx.db
      .query("savings_goals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get all transactions linked to goals
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const linkedTransactions = transactions.filter((t) => t.goalId);

    // Sum linked amounts per goal
    const savedByGoal: Record<string, number> = {};
    for (const t of linkedTransactions) {
      if (t.goalId) {
        savedByGoal[t.goalId] = (savedByGoal[t.goalId] ?? 0) + t.amount;
      }
    }

    const now = Date.now();

    return goals.map((g) => {
      const currentAmount = savedByGoal[g._id] ?? 0;
      const percentage =
        g.targetAmount > 0 ? (currentAmount / g.targetAmount) * 100 : 0;
      const daysLeft = Math.max(
        0,
        Math.ceil((g.targetDate - now) / (1000 * 60 * 60 * 24))
      );

      return {
        ...g,
        currentAmount,
        percentage: Math.min(percentage, 100),
        daysLeft,
        isCompleted: percentage >= 100,
        isOverdue: g.targetDate < now && percentage < 100,
      };
    });
  },
});
