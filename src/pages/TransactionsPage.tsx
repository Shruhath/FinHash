import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getCurrencyByCountry } from "../lib/countries";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import "./TransactionsPage.css";

export default function TransactionsPage() {
  const user = useCurrentUser();
  const categories = useQuery(api.categories.getCategories) ?? [];
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const editTransactionMut = useMutation(api.transactions.editTransaction);

  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<Id<"transactions"> | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");

  const currencySymbol = user
    ? getCurrencyByCountry(user.country).symbol
    : "$";

  const queryArgs: {
    type?: "income" | "expense";
    startDate?: number;
    endDate?: number;
  } = {};
  if (typeFilter) queryArgs.type = typeFilter;
  if (startDate) queryArgs.startDate = new Date(startDate).getTime();
  if (endDate)
    queryArgs.endDate = new Date(endDate + "T23:59:59").getTime();

  const transactions =
    useQuery(api.transactions.getTransactions, queryArgs) ?? [];

  // Client-side category filter
  const filteredTransactions = categoryFilter
    ? transactions.filter((t) => t.categoryId === categoryFilter)
    : transactions;

  const getCategoryName = (catId: string) =>
    categories.find((c) => c._id === catId)?.name ?? "Unknown";

  const getCategoryColor = (catId: string) =>
    categories.find((c) => c._id === catId)?.color ?? "#71717a";

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleDelete = async (id: Id<"transactions">) => {
    try {
      await deleteTransaction({ id });
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const startEdit = (tx: (typeof transactions)[number]) => {
    setEditingId(tx._id);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.categoryId);
    setEditDescription(tx.description ?? "");
    setEditDate(new Date(tx.date).toISOString().slice(0, 16));
    setEditType(tx.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await editTransactionMut({
        id: editingId,
        amount: parseFloat(editAmount),
        type: editType,
        categoryId: editCategory as Id<"categories">,
        date: new Date(editDate).getTime(),
        description: editDescription || undefined,
      });
      toast.success("Transaction updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update transaction");
    }
  };

  const clearFilters = () => {
    setTypeFilter("");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    !!typeFilter || !!categoryFilter || !!startDate || !!endDate;

  return (
    <DashboardLayout>
      <div className="transactions-page">
        <div className="transactions-page__header">
          <div>
            <h1 className="transactions-page__title">Transactions</h1>
            <p className="transactions-page__count">
              {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="transactions-page__actions">
            <button
              className={`transactions-page__filter-btn ${hasActiveFilters ? "transactions-page__filter-btn--active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && (
                <span
                  className="transactions-page__filter-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                >
                  <X size={14} />
                </span>
              )}
            </button>
            <button
              className="dashboard__add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={20} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-bar">
            <select
              className="form-input filters-bar__input"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "" | "income" | "expense")
              }
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              className="form-input filters-bar__input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="form-input filters-bar__input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />

            <input
              type="date"
              className="form-input filters-bar__input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
            />
          </div>
        )}

        {/* Transaction List */}
        <div className="tx-list">
          {filteredTransactions.length === 0 ? (
            <div className="tx-list__empty">
              <p>No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div className="tx-item" key={tx._id}>
                {editingId === tx._id ? (
                  /* Edit Mode */
                  <div className="tx-item__edit">
                    <div className="tx-item__edit-row">
                      <select
                        className="form-input"
                        value={editType}
                        onChange={(e) =>
                          setEditType(e.target.value as "income" | "expense")
                        }
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <select
                        className="form-input"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                      >
                        {categories
                          .filter((c) => c.type === editType)
                          .map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="tx-item__edit-row">
                      <input
                        type="number"
                        className="form-input"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        step="0.01"
                      />
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                    />
                    <div className="tx-item__edit-actions">
                      <button className="btn btn--accent" onClick={saveEdit}>
                        Save
                      </button>
                      <button className="btn btn--ghost" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div
                      className="tx-item__dot"
                      style={{
                        backgroundColor: getCategoryColor(tx.categoryId),
                      }}
                    />
                    <div className="tx-item__info">
                      <span className="tx-item__category">
                        {getCategoryName(tx.categoryId)}
                      </span>
                      <span className="tx-item__meta">
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {tx.description && ` · ${tx.description}`}
                        {tx.splitGroupId && (
                          <span className="tx-item__split-badge">Split</span>
                        )}
                      </span>
                    </div>
                    <span
                      className={`tx-item__amount ${
                        tx.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                    <div className="tx-item__actions">
                      <button
                        className="tx-item__action-btn"
                        onClick={() => startEdit(tx)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="tx-item__action-btn tx-item__action-btn--danger"
                        onClick={() => handleDelete(tx._id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </DashboardLayout>
  );
}
