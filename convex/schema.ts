import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    photoUrl: v.optional(v.string()),
    country: v.string(),
    currency: v.string(),
    theme: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.id("categories"),
    date: v.number(),
    description: v.optional(v.string()),
    splitGroupId: v.optional(v.string()),
    goalId: v.optional(v.id("savings_goals")),
    isRecurring: v.optional(v.boolean()),
    recurringFrequency: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      )
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_type", ["userId", "type"])
    .index("by_split_group", ["splitGroupId"]),

  categories: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.string(),
    color: v.string(),
    isDefault: v.boolean(),
  }).index("by_user", ["userId"]),

  budgets: defineTable({
    userId: v.id("users"),
    categoryId: v.id("categories"),
    amount: v.number(),
    month: v.string(),
    isRecurring: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_month", ["userId", "month"]),

  savings_goals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.number(),
    description: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  debts: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("lent"), v.literal("borrowed")),
    personName: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isCompleted: v.boolean(),
    completedDate: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "isCompleted"]),
});
