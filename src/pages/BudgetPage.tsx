import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getCurrencyByCountry } from "../lib/countries";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Repeat,
  X,
} from "lucide-react";
import { toast } from "sonner";
import "./BudgetPage.css";

export default function BudgetPage() {
  const user = useCurrentUser();
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addBudget = useMutation(api.budgets.addBudget);
  const updateBudget = useMutation(api.budgets.updateBudget);
  const deleteBudget = useMutation(api.budgets.deleteBudget);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  const budgets = useQuery(api.budgets.getBudgetsWithSpending, { month: monthStr }) ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"budgets"> | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);

  const currencySymbol = user ? getCurrencyByCountry(user.country).symbol : "$";

  const expenseCategories = categories.filter((c) => c.type === "expense");
  // Filter out categories that already have a budget (unless editing)
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.categoryId === c._id) || editingId
  );

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormCategory("");
    setFormAmount("");
    setFormRecurring(false);
  };

  const startEdit = (b: (typeof budgets)[number]) => {
    setEditingId(b._id);
    setFormCategory(b.categoryId);
    setFormAmount(b.budgetAmount.toString());
    setFormRecurring(b.isRecurring);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBudget({
          id: editingId,
          amount: parseFloat(formAmount),
          isRecurring: formRecurring,
        });
        toast.success("Budget updated");
      } else {
        await addBudget({
          categoryId: formCategory as Id<"categories">,
          amount: parseFloat(formAmount),
          month: monthStr,
          isRecurring: formRecurring,
        });
        toast.success("Budget added");
      }
      resetForm();
    } catch {
      toast.error("Failed to save budget");
    }
  };

  const handleDelete = async (id: Id<"budgets">, isRecurring: boolean) => {
    try {
      await deleteBudget({ id, deleteAllFuture: isRecurring });
      toast.success("Budget deleted");
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  // Totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <DashboardLayout>
      <div className="budget-page">
        <div className="budget-page__header">
          <div>
            <h1 className="budget-page__title">Budget Manager</h1>
            <p className="budget-page__subtitle">
              {formatCurrency(totalSpent)} spent of {formatCurrency(totalBudgeted)} budgeted
            </p>
          </div>
          <button
            className="dashboard__add-btn"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus size={20} />
            <span>Add Budget</span>
          </button>
        </div>

        {/* Month Selector */}
        <div className="period-selector">
          <button className="period-selector__btn" onClick={goToPrevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span className="period-selector__label">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button className="period-selector__btn" onClick={goToNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="budget-form-card">
            <div className="budget-form-card__header">
              <h3>{editingId ? "Edit Budget" : "New Budget"}</h3>
              <button className="modal__close" onClick={resetForm}>
                <X size={18} />
              </button>
            </div>
            <form className="budget-form" onSubmit={handleSubmit}>
              {!editingId && (
                <select
                  className="form-input"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {availableCategories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              )}
              <input
                type="number"
                className="form-input"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Budget amount"
                min="1"
                step="0.01"
                required
              />
              <label className="budget-form__recurring">
                <input
                  type="checkbox"
                  checked={formRecurring}
                  onChange={(e) => setFormRecurring(e.target.checked)}
                />
                <Repeat size={14} />
                Apply to all future months
              </label>
              <button type="submit" className="btn btn--accent">
                {editingId ? "Save Changes" : "Add Budget"}
              </button>
            </form>
          </div>
        )}

        {/* Budget List */}
        {budgets.length === 0 ? (
          <div className="budget-empty">
            <p>No budgets set for this month.</p>
            <p className="budget-empty__hint">
              Click "Add Budget" to set spending limits by category.
            </p>
          </div>
        ) : (
          <div className="budget-list">
            {budgets.map((b) => (
              <div className="budget-item" key={b._id}>
                <div className="budget-item__top">
                  <div className="budget-item__info">
                    <span
                      className="budget-item__dot"
                      style={{ backgroundColor: b.categoryColor }}
                    />
                    <span className="budget-item__name">{b.categoryName}</span>
                    {b.isRecurring && (
                      <Repeat size={12} className="budget-item__recurring" />
                    )}
                  </div>
                  <div className="budget-item__actions">
                    <button
                      className="tx-item__action-btn"
                      onClick={() => startEdit(b)}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="tx-item__action-btn tx-item__action-btn--danger"
                      onClick={() => handleDelete(b._id, b.isRecurring)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="budget-item__bar-container">
                  <div
                    className={`budget-item__bar budget-item__bar--${b.status}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>

                <div className="budget-item__bottom">
                  <span className="budget-item__spent">
                    {formatCurrency(b.spent)} / {formatCurrency(b.budgetAmount)}
                  </span>
                  <span className={`budget-item__pct budget-item__pct--${b.status}`}>
                    {b.percentage.toFixed(0)}% Used
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
