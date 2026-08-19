import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import Sheet from "../ui/Sheet";
import SegmentedControl from "../ui/SegmentedControl";
import CategoryIcon from "../ui/CategoryIcon";
import { useCurrency } from "../../hooks/useCurrency";
import { toDateTimeLocal } from "../../lib/format";
import { haptic } from "../../lib/haptics";

interface Props {
  transaction: Doc<"transactions"> | null;
  onClose: () => void;
}

export default function EditTransactionSheet({ transaction, onClose }: Props) {
  const categories = useQuery(api.categories.getCategories) ?? [];
  const editTransaction = useMutation(api.transactions.editTransaction);
  const { symbol } = useCurrency();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.categoryId);
    setDescription(transaction.description ?? "");
    setDate(toDateTimeLocal(transaction.date));
    setSaving(false);
  }, [transaction]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!transaction || saving) return;
    setSaving(true);
    try {
      await editTransaction({
        id: transaction._id,
        amount: parseFloat(amount),
        type,
        categoryId: categoryId as Id<"categories">,
        date: new Date(date).getTime(),
        description: description.trim() || undefined,
      });
      haptic("success");
      toast.success("Transaction updated");
      onClose();
    } catch {
      haptic("error");
      toast.error("Couldn't update that transaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={!!transaction}
      onClose={onClose}
      title="Edit transaction"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn btn--accent"
            form="edit-transaction-form"
            type="submit"
            disabled={saving || !amount || !categoryId}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form id="edit-transaction-form" className="add-tx" onSubmit={handleSubmit}>
        <SegmentedControl
          fluid
          segments={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          value={type}
          onChange={(next) => {
            setType(next);
            const stillValid = categories.find(
              (c) => c._id === categoryId && c.type === next
            );
            if (!stillValid) setCategoryId("");
          }}
        />

        <div className={`amount-input amount-input--${type}`}>
          <span className="amount-input__symbol">{symbol}</span>
          <input
            type="number"
            inputMode="decimal"
            className="amount-input__field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </div>

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
                    ? ({ "--cat-color": c.color } as React.CSSProperties)
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
          <label className="field__label" htmlFor="edit-note">
            Note
          </label>
          <input
            id="edit-note"
            type="text"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was it for?"
            maxLength={120}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="edit-date">
            Date & time
          </label>
          <input
            id="edit-date"
            type="datetime-local"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </form>
    </Sheet>
  );
}
