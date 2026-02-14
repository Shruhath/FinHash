import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: "Food & Dining", type: "expense" as const, icon: "Utensils", color: "#f97316" },
  { name: "Rent & Housing", type: "expense" as const, icon: "Home", color: "#8b5cf6" },
  { name: "Transport", type: "expense" as const, icon: "Car", color: "#3b82f6" },
  { name: "Shopping", type: "expense" as const, icon: "ShoppingBag", color: "#ec4899" },
  { name: "Entertainment", type: "expense" as const, icon: "Gamepad2", color: "#a855f7" },
  { name: "Health", type: "expense" as const, icon: "Heart", color: "#ef4444" },
  { name: "Education", type: "expense" as const, icon: "GraduationCap", color: "#06b6d4" },
  { name: "Bills & Utilities", type: "expense" as const, icon: "Zap", color: "#eab308" },
  { name: "Groceries", type: "expense" as const, icon: "ShoppingCart", color: "#22c55e" },
  { name: "Personal Care", type: "expense" as const, icon: "Sparkles", color: "#f472b6" },
  { name: "Travel", type: "expense" as const, icon: "Plane", color: "#0ea5e9" },
  { name: "Subscriptions", type: "expense" as const, icon: "CreditCard", color: "#6366f1" },
  { name: "Other Expense", type: "expense" as const, icon: "MoreHorizontal", color: "#71717a" },

  // Income categories
  { name: "Salary", type: "income" as const, icon: "Briefcase", color: "#22c55e" },
  { name: "Freelance", type: "income" as const, icon: "Laptop", color: "#10b981" },
  { name: "Investments", type: "income" as const, icon: "TrendingUp", color: "#14b8a6" },
  { name: "Gifts", type: "income" as const, icon: "Gift", color: "#f59e0b" },
  { name: "Refunds", type: "income" as const, icon: "RotateCcw", color: "#6366f1" },
  { name: "Other Income", type: "income" as const, icon: "MoreHorizontal", color: "#71717a" },
];

export const seedDefaultCategories = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if user already has categories
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return; // Already seeded

    for (const cat of DEFAULT_CATEGORIES) {
      await ctx.db.insert("categories", {
        userId: args.userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      });
    }
  },
});

export const getCategories = query({
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

    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const addCategory = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.string(),
    color: v.string(),
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

    return await ctx.db.insert("categories", {
      userId: user._id,
      name: args.name,
      type: args.type,
      icon: args.icon,
      color: args.color,
      isDefault: false,
    });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      name: args.name,
      icon: args.icon,
      color: args.color,
    });
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});
