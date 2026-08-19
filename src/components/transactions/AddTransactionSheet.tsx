import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Split, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Sheet from "../ui/Sheet";
import SegmentedControl from "../ui/SegmentedControl";
import CategoryIcon from "../ui/CategoryIcon";
import { useCurrency } from "../../hooks/useCurrency";
import { haptic } from "../../lib/haptics";
import { monthKey, toDateTimeLocal } from "../../lib/format";
import { EASE_OUT } from "../../lib/motion";
import "./add-transaction.css";

interface SplitRow {
  amount: string;
  categoryId: string;
  description: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-fills the form when opened from a goal or category context. */
  preset?: { goalId?: string; type?: "income" | "expense"; categoryId?: string };
}

const emptySplits = (): SplitRow[] => [
  { amount: "", categoryId: "", description: "" },
  { amount: "", categoryId: "", description: "" },
];

const DAY = 86_400_000;

export default function AddTransactionSheet({ open, onClose, preset }: Props) {
  const categories = useQuery(api.categories.getCategories) ?? [];
  const goals = useQuery(api.savings_goals.getGoalsWithProgress) ?? [];
  const addTransaction = useMutation(api.transactions.addTransaction);
  const splitTransaction = useMutation(api.transactions.splitTransaction);
  const { symbol, format } = useCurrency();

  const now = new Date();
  const budgets =
    useQuery(api.budgets.getBudgetsWithSpending, {
      month: monthKey(now.getFullYear(), now.getMonth()),
    }) ?? [];

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => toDateTimeLocal(Date.now()));
  const [goalId, setGoalId] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>(emptySplits);
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // A fresh sheet every time it opens — nothing carries over.
  useEffect(() => {
    if (!open) return;
    setType(preset?.type ?? "expense");
    setAmount("");
    setCategoryId(preset?.categoryId ?? "");
    setDescription("");
    setDate(toDateTimeLocal(Date.now()));
    setGoalId(preset?.goalId ?? "");
    setIsSplit(false);
    setSplits(emptySplits());
    setSaving(false);
  }, [open, preset]);

  const splitTotal = splits.reduce(
    (sum, s) => sum + (parseFloat(s.amount) || 0),
    0
  );
  const parsedAmount = parseFloat(amount) || 0;
  const splitRemainder = parsedAmount - splitTotal;

  const updateSplit = (index: number, field: keyof SplitRow, value: string) => {
    setSplits((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const setQuickDate = (offsetDays: number) => {
    haptic("light");
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setDate(toDateTimeLocal(target.getTime()));
  };

  const activeDayOffset = (() => {
    const chosen = new Date(date);
    chosen.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((chosen.getTime() - today.getTime()) / DAY);
  })();

  const warnOnBudget = (catId: string, spentDelta: number) => {
    const budget = budgets.find((b) => b.categoryId === catId);
    if (!budget) return;
    const newSpent = budget.spent + spentDelta;
    const pct = (newSpent / budget.budgetAmount) * 100;
    if (pct >= 100) {
      haptic("error");
      toast.warning(`${budget.categoryName} budget exceeded`, {
        description: `${format(newSpent)} of ${format(budget.budgetAmount)} — ${pct.toFixed(0)}% used`,
        duration: 5500,
      });
    } else if (pct >= 80) {
      toast.warning(`${budget.categoryName} at ${pct.toFixed(0)}%`, {
        description: `${format(budget.budgetAmount - newSpent)} left this month`,
        duration: 4500,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const dateTimestamp = new Date(date).getTime();
    setSaving(true);

    try {
      if (isSplit) {
        if (Math.abs(splitRemainder) > 0.01) {
          toast.error("Splits must add up to the total amount");
          setSaving(false);
          return;
        }

        const validSplits = splits
          .filter((s) => parseFloat(s.amount) > 0 && s.categoryId)
          .map((s) => ({
            amount: parseFloat(s.amount),
            categoryId: s.categoryId as Id<"categories">,
            description: s.description || undefined,
          }));

        if (validSplits.length < 2) {
          toast.error("Add at least two split rows with a category");
          setSaving(false);
          return;
        }

        await splitTransaction({
          splits: validSplits,
          date: dateTimestamp,
          type,
        });
        haptic("success");
        toast.success(`Split into ${validSplits.length} entries`);
        if (type === "expense") {
          validSplits.forEach((s) => warnOnBudget(s.categoryId, s.amount));
        }
      } else {
        if (!categoryId) {
          toast.error("Pick a category");
          setSaving(false);
          return;
        }

        await addTransaction({
          amount: parsedAmount,
          type,
          categoryId: categoryId as Id<"categories">,
          date: dateTimestamp,
          description: description.trim() || undefined,
          goalId: goalId ? (goalId as Id<"savings_goals">) : undefined,
        });

        haptic("success");
        toast.success(
          `${type === "income" ? "Income" : "Expense"} of ${format(parsedAmount)} added`
        );
        if (type === "expense") warnOnBudget(categoryId, parsedAmount);
      }

      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
      haptic("error");
      toast.error("Couldn't save that — try again");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    parsedAmount > 0 && (isSplit ? Math.abs(splitRemainder) < 0.01 : !!categoryId);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add transaction"
      size="md"
      footer={
        <button
          type="submit"
          form="add-transaction-form"
          className="btn btn--accent btn--lg btn--block"
          disabled={saving || !canSubmit}
        >
          {saving
            ? "Saving…"
            : parsedAmount > 0
              ? `Add ${format(parsedAmount)}`
              : "Add transaction"}
        </button>
      }
    >
      <form
        id="add-transaction-form"
        className="add-tx"
        onSubmit={handleSubmit}
      >
        <SegmentedControl
          fluid
          segments={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          value={type}
          onChange={(next) => {
            setType(next);
            setCategoryId("");
            setGoalId("");
            setSplits(emptySplits());
          }}
        />

        {/* Amount */}
        <div className={`amount-input amount-input--${type}`}>
          <span className="amount-input__symbol">{symbol}</span>
          <input
            type="number"
            inputMode="decimal"
            className="amount-input__field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
            autoComplete="off"
          />
        </div>

        {/* Date */}
        <div className="field">
          <span className="field__label">When</span>
          <div className="hscroll">
            {[
              { label: "Today", offset: 0 },
              { label: "Yesterday", offset: -1 },
              { label: "2 days ago", offset: -2 },
            ].map(({ label, offset }) => (
              <button
                key={offset}
                type="button"
                className={`chip ${activeDayOffset === offset ? "chip--active" : ""}`}
                onClick={() => setQuickDate(offset)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Split toggle */}
        <button
          type="button"
          className={`split-switch ${isSplit ? "split-switch--on" : ""}`}
          onClick={() => {
            haptic("light");
            setIsSplit((v) => !v);
          }}
        >
          <Split size={16} />
          <span className="split-switch__text">
            Split across categories
            <small>Divide one payment into several entries</small>
          </span>
          <span className="split-switch__track">
            <motion.span
              className="split-switch__thumb"
              animate={{ x: isSplit ? 18 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            />
          </span>
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {!isSplit ? (
            <motion.div
              key="single"
              className="add-tx__section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <div className="field">
                <span className="field__label">Category</span>
                <div className="category-picker">
                  {filteredCategories.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      className={`category-picker__item ${categoryId === c._id ? "category-picker__item--active" : ""}`}
                      onClick={() => {
                        haptic("light");
                        setCategoryId(c._id);
                      }}
                      style={
                        categoryId === c._id
                          ? ({
                              "--cat-color": c.color,
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <CategoryIcon
                        name={c.icon}
                        color={c.color}
                        size={18}
                        tileSize={38}
                      />
                      <span className="category-picker__name">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="tx-note">
                  Note
                </label>
                <input
                  id="tx-note"
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was it for?"
                  maxLength={120}
                />
              </div>

              {goals.length > 0 && (
                <div className="field">
                  <span className="field__label">
                    <Target size={12} style={{ display: "inline", marginRight: 4 }} />
                    Count toward a goal
                  </span>
                  <select
                    className="form-input"
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                  >
                    <option value="">None</option>
                    {goals
                      .filter((g) => !g.isCompleted)
                      .map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name} · {g.percentage.toFixed(0)}%
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="split"
              className="add-tx__section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <div className="split-header">
                <span className="field__label">Split details</span>
                <span
                  className={`split-header__balance ${Math.abs(splitRemainder) < 0.01 ? "split-header__balance--ok" : ""}`}
                >
                  {Math.abs(splitRemainder) < 0.01
                    ? "Balanced"
                    : `${format(Math.abs(splitRemainder))} ${splitRemainder > 0 ? "left" : "over"}`}
                </span>
              </div>

              {splits.map((split, index) => (
                <div className="split-row" key={index}>
                  <select
                    className="form-input"
                    value={split.categoryId}
                    onChange={(e) =>
                      updateSplit(index, "categoryId", e.target.value)
                    }
                    required
                  >
                    <option value="" disabled>
                      Category
                    </option>
                    {filteredCategories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-input split-row__amount"
                    value={split.amount}
                    onChange={(e) => updateSplit(index, "amount", e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                  {splits.length > 2 && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() =>
                        setSplits((prev) => prev.filter((_, i) => i !== index))
                      }
                      aria-label="Remove split row"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <div className="split-actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() =>
                    setSplits((prev) => [
                      ...prev,
                      { amount: "", categoryId: "", description: "" },
                    ])
                  }
                >
                  <Plus size={15} /> Add row
                </button>
                {splitRemainder > 0.01 && splits.length > 0 && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      setSplits((prev) => {
                        const last = prev.length - 1;
                        return prev.map((row, i) =>
                          i === last
                            ? {
                                ...row,
                                amount: (
                                  (parseFloat(row.amount) || 0) + splitRemainder
                                ).toFixed(2),
                              }
                            : row
                        );
                      })
                    }
                  >
                    Fill remainder
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Sheet>
  );
}
