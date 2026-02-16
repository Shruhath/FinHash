import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X, Plus, Trash2, Split } from "lucide-react";
import { toast } from "sonner";
import "./AddTransactionModal.css";

interface SplitRow {
  amount: string;
  categoryId: string;
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: Props) {
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addTransaction = useMutation(api.transactions.addTransaction);
  const splitTransaction = useMutation(api.transactions.splitTransaction);

  // Budget check: get current month budgets
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const budgets = useQuery(api.budgets.getBudgetsWithSpending, { month: currentMonth }) ?? [];

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 16) // datetime-local format
  );
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>([
    { amount: "", categoryId: "", description: "" },
    { amount: "", categoryId: "", description: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategoryId("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 16));
    setIsSplit(false);
    setSplits([
      { amount: "", categoryId: "", description: "" },
      { amount: "", categoryId: "", description: "" },
    ]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateSplit = (index: number, field: keyof SplitRow, value: string) => {
    const updated = [...splits];
    updated[index] = { ...updated[index]!, [field]: value };
    setSplits(updated);
  };

  const addSplitRow = () => {
    setSplits([...splits, { amount: "", categoryId: "", description: "" }]);
  };

  const removeSplitRow = (index: number) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const splitTotal = splits.reduce(
    (sum, s) => sum + (parseFloat(s.amount) || 0),
    0
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dateTimestamp = new Date(date).getTime();

      if (isSplit) {
        const totalAmount = parseFloat(amount);
        if (Math.abs(splitTotal - totalAmount) > 0.01) {
          toast.error("Split amounts must equal the total amount");
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
          toast.error("At least 2 valid split rows required");
          setSaving(false);
          return;
        }

        await splitTransaction({
          splits: validSplits,
          date: dateTimestamp,
          type,
        });

        toast.success("Split transaction added!");
      } else {
        if (!categoryId) {
          toast.error("Please select a category");
          setSaving(false);
          return;
        }

        await addTransaction({
          amount: parseFloat(amount),
          type,
          categoryId: categoryId as Id<"categories">,
          date: dateTimestamp,
          description: description || undefined,
        });

        // Check budget warning
        if (type === "expense") {
          const budget = budgets.find((b) => b.categoryId === categoryId);
          if (budget) {
            const newSpent = budget.spent + parseFloat(amount);
            const newPct = (newSpent / budget.budgetAmount) * 100;
            if (newPct >= 100) {
              const catName = budget.categoryName;
              toast.warning(
                `Budget Exceeded! "${catName}" is now at ${newPct.toFixed(0)}% (${newSpent.toFixed(2)} / ${budget.budgetAmount.toFixed(2)})`,
                { duration: 5000 }
              );
            } else if (newPct >= 75) {
              toast.warning(
                `Budget Warning: "${budget.categoryName}" is at ${newPct.toFixed(0)}%`,
                { duration: 4000 }
              );
            }
          }
        }

        toast.success("Transaction added!");
      }

      handleClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Add Transaction</h2>
          <button className="modal__close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle__btn ${type === "expense" ? "type-toggle__btn--active type-toggle__btn--expense" : ""}`}
              onClick={() => { setType("expense"); setCategoryId(""); }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`type-toggle__btn ${type === "income" ? "type-toggle__btn--active type-toggle__btn--income" : ""}`}
              onClick={() => { setType("income"); setCategoryId(""); }}
            >
              Income
            </button>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-input form-input--amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          {/* Split Toggle */}
          <div className="split-toggle">
            <button
              type="button"
              className={`split-toggle__btn ${isSplit ? "split-toggle__btn--active" : ""}`}
              onClick={() => setIsSplit(!isSplit)}
            >
              <Split size={16} />
              {isSplit ? "Split ON" : "Split Transaction"}
            </button>
          </div>

          {!isSplit ? (
            <>
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {filteredCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note..."
                />
              </div>
            </>
          ) : (
            <div className="split-section">
              <div className="split-section__header">
                <span className="form-label">Split Details</span>
                <span
                  className={`split-section__total ${
                    amount && Math.abs(splitTotal - parseFloat(amount)) > 0.01
                      ? "split-section__total--mismatch"
                      : ""
                  }`}
                >
                  {splitTotal.toFixed(2)} / {parseFloat(amount || "0").toFixed(2)}
                </span>
              </div>

              {splits.map((split, index) => (
                <div className="split-row" key={index}>
                  <select
                    className="form-input split-row__category"
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
                    className="form-input split-row__amount"
                    value={split.amount}
                    onChange={(e) =>
                      updateSplit(index, "amount", e.target.value)
                    }
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                  {splits.length > 2 && (
                    <button
                      type="button"
                      className="split-row__remove"
                      onClick={() => removeSplitRow(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="split-section__add"
                onClick={addSplitRow}
              >
                <Plus size={16} /> Add Row
              </button>
            </div>
          )}

          <button
            type="submit"
            className="modal__submit"
            disabled={saving || !amount}
          >
            {saving ? "Adding..." : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
