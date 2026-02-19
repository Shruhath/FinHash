import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const importTransactions = mutation({
    args: {
        transactions: v.array(
            v.object({
                amount: v.number(),
                date: v.string(),
                description: v.string(),
                type: v.union(v.literal("income"), v.literal("expense")),
                categoryName: v.optional(v.string()), // We will try to match by name
            })
        ),
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

        // Fetch all user categories for matching
        const categories = await ctx.db
            .query("categories")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        let importedCount = 0;

        for (const txn of args.transactions) {
            // 1. Try to find a matching category by name (case-insensitive)
            let categoryId = categories.find(
                (c) => c.name.toLowerCase() === txn.categoryName?.toLowerCase()
            )?._id;

            // 2. If not found, fallback to "Other Expense" or "Other Income"
            if (!categoryId) {
                categoryId = categories.find(
                    (c) =>
                        c.name ===
                        (txn.type === "income" ? "Other Income" : "Other Expense")
                )?._id;
            }

            // 3. Insert transaction
            if (categoryId) {
                await ctx.db.insert("transactions", {
                    userId: user._id,
                    amount: txn.amount,
                    date: new Date(txn.date).getTime(), // Convert string date to timestamp
                    description: txn.description,
                    type: txn.type,
                    categoryId: categoryId,
                });
                importedCount++;
            }
        }

        return { success: true, count: importedCount };
    },
});
