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
  X,
  CheckCircle2,
  Undo2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import "./DebtsPage.css";

export default function DebtsPage() {
  const user = useCurrentUser();
  const debts = useQuery(api.debts.getDebts) ?? [];
  const addDebt = useMutation(api.debts.addDebt);
  const updateDebt = useMutation(api.debts.updateDebt);
  const deleteDebt = useMutation(api.debts.deleteDebt);
  const markComplete = useMutation(api.debts.markComplete);
  const undoComplete = useMutation(api.debts.undoComplete);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"debts"> | null>(null);
  const [formType, setFormType] = useState<"lent" | "borrowed">("lent");
  const [formPerson, setFormPerson] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  // Settlement confirmation
  const [settlingId, setSettlingId] = useState<Id<"debts"> | null>(null);

  const [showCompleted, setShowCompleted] = useState(false);

  const currencySymbol = user ? getCurrencyByCountry(user.country).symbol : "$";

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormType("lent");
    setFormPerson("");
    setFormAmount("");
    setFormDescription("");
    setFormDueDate("");
  };

  const startEdit = (d: (typeof debts)[number]) => {
    setEditingId(d._id);
    setFormType(d.type);
    setFormPerson(d.personName);
    setFormAmount(d.amount.toString());
    setFormDescription(d.description ?? "");
    setFormDueDate(d.dueDate ? new Date(d.dueDate).toISOString().split("T")[0]! : "");
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDebt({
          id: editingId,
          personName: formPerson,
          amount: parseFloat(formAmount),
          description: formDescription || undefined,
          dueDate: formDueDate ? new Date(formDueDate).getTime() : undefined,
        });
        toast.success("Debt updated");
      } else {
        await addDebt({
          type: formType,
          personName: formPerson,
          amount: parseFloat(formAmount),
          description: formDescription || undefined,
          dueDate: formDueDate ? new Date(formDueDate).getTime() : undefined,
        });
        toast.success("Debt added");
      }
      resetForm();
    } catch {
      toast.error("Failed to save debt");
    }
  };

  const handleDelete = async (id: Id<"debts">) => {
    try {
      await deleteDebt({ id });
      toast.success("Debt deleted");
    } catch {
      toast.error("Failed to delete debt");
    }
  };

  const handleSettle = async (id: Id<"debts">, recordTransaction: boolean) => {
    try {
      await markComplete({ id, recordAsTransaction: recordTransaction });
      toast.success(
        recordTransaction
          ? "Debt settled & transaction recorded"
          : "Debt marked as complete"
      );
      setSettlingId(null);
    } catch {
      toast.error("Failed to settle debt");
    }
  };

  const handleUndoComplete = async (id: Id<"debts">) => {
    try {
      await undoComplete({ id });
      toast.success("Debt re-opened");
    } catch {
      toast.error("Failed to undo");
    }
  };

  const activeDebts = debts.filter((d) => !d.isCompleted);
  const completedDebts = debts.filter((d) => d.isCompleted);

  const toReceive = activeDebts.filter((d) => d.type === "lent");
  const toPay = activeDebts.filter((d) => d.type === "borrowed");

  const totalToReceive = toReceive.reduce((s, d) => s + d.amount, 0);
  const totalToPay = toPay.reduce((s, d) => s + d.amount, 0);

  return (
    <DashboardLayout>
      <div className="debts-page">
        <div className="debts-page__header">
          <div>
            <h1 className="debts-page__title">Debts & Loans</h1>
            <p className="debts-page__subtitle">
              {activeDebts.length} active debt{activeDebts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className="dashboard__add-btn"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus size={20} />
            <span>Add Debt</span>
          </button>
        </div>

        {/* Summary */}
        {activeDebts.length > 0 && (
          <div className="debts-summary">
            <div className="debts-summary__card debts-summary__card--receive">
              <ArrowDownLeft size={20} />
              <div>
                <span className="debts-summary__label">To Receive</span>
                <span className="debts-summary__value text-income">
                  {formatCurrency(totalToReceive)}
                </span>
              </div>
            </div>
            <div className="debts-summary__card debts-summary__card--pay">
              <ArrowUpRight size={20} />
              <div>
                <span className="debts-summary__label">To Pay</span>
                <span className="debts-summary__value text-expense">
                  {formatCurrency(totalToPay)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="budget-form-card">
            <div className="budget-form-card__header">
              <h3>{editingId ? "Edit Debt" : "New Debt"}</h3>
              <button className="modal__close" onClick={resetForm}>
                <X size={18} />
              </button>
            </div>
            <form className="budget-form" onSubmit={handleSubmit}>
              {!editingId && (
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-toggle__btn ${formType === "lent" ? "type-toggle__btn--active type-toggle__btn--income" : ""}`}
                    onClick={() => setFormType("lent")}
                  >
                    To Receive (Lent)
                  </button>
                  <button
                    type="button"
                    className={`type-toggle__btn ${formType === "borrowed" ? "type-toggle__btn--active type-toggle__btn--expense" : ""}`}
                    onClick={() => setFormType("borrowed")}
                  >
                    To Pay (Borrowed)
                  </button>
                </div>
              )}
              <input
                type="text"
                className="form-input"
                value={formPerson}
                onChange={(e) => setFormPerson(e.target.value)}
                placeholder="Person name"
                required
              />
              <input
                type="number"
                className="form-input"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Amount"
                min="0.01"
                step="0.01"
                required
              />
              <input
                type="text"
                className="form-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <input
                type="date"
                className="form-input"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
              <button type="submit" className="btn btn--accent">
                {editingId ? "Save Changes" : "Add Debt"}
              </button>
            </form>
          </div>
        )}

        {/* Settlement Confirmation Modal */}
        {settlingId && (
          <div className="modal-overlay" onClick={() => setSettlingId(null)}>
            <div className="modal settle-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal__header">
                <h2 className="modal__title">Settle Debt</h2>
                <button className="modal__close" onClick={() => setSettlingId(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="settle-modal__body">
                <p>Record this settlement as a transaction?</p>
                <p className="settle-modal__hint">
                  This will automatically create an income/expense entry for the settled amount.
                </p>
                <div className="settle-modal__actions">
                  <button
                    className="btn btn--accent"
                    onClick={() => handleSettle(settlingId, true)}
                  >
                    Yes, Record Transaction
                  </button>
                  <button
                    className="btn btn--ghost"
                    onClick={() => handleSettle(settlingId, false)}
                  >
                    No, Just Mark Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debt Lists */}
        {activeDebts.length === 0 && completedDebts.length === 0 ? (
          <div className="budget-empty">
            <p>No debts tracked yet.</p>
            <p className="budget-empty__hint">
              Add a debt to keep track of money lent or borrowed.
            </p>
          </div>
        ) : (
          <>
            {/* To Receive */}
            {toReceive.length > 0 && (
              <div className="debt-section">
                <h2 className="debt-section__title">
                  <ArrowDownLeft size={18} className="text-income" /> To Receive
                </h2>
                <div className="debt-list">
                  {toReceive.map((d) => (
                    <DebtItem
                      key={d._id}
                      debt={d}
                      formatCurrency={formatCurrency}
                      onEdit={() => startEdit(d)}
                      onDelete={() => handleDelete(d._id)}
                      onSettle={() => setSettlingId(d._id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* To Pay */}
            {toPay.length > 0 && (
              <div className="debt-section">
                <h2 className="debt-section__title">
                  <ArrowUpRight size={18} className="text-expense" /> To Pay
                </h2>
                <div className="debt-list">
                  {toPay.map((d) => (
                    <DebtItem
                      key={d._id}
                      debt={d}
                      formatCurrency={formatCurrency}
                      onEdit={() => startEdit(d)}
                      onDelete={() => handleDelete(d._id)}
                      onSettle={() => setSettlingId(d._id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedDebts.length > 0 && (
              <div className="debt-section">
                <button
                  className="debt-section__toggle"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <CheckCircle2 size={18} className="text-success" />
                  Completed ({completedDebts.length})
                </button>
                {showCompleted && (
                  <div className="debt-list">
                    {completedDebts.map((d) => (
                      <div className="debt-item debt-item--completed" key={d._id}>
                        <div className="debt-item__info">
                          <span className="debt-item__person">{d.personName}</span>
                          <span className="debt-item__meta">
                            {d.type === "lent" ? "Received" : "Paid"}
                            {d.completedDate &&
                              ` · ${new Date(d.completedDate).toLocaleDateString()}`}
                          </span>
                        </div>
                        <span className="debt-item__amount">
                          {formatCurrency(d.amount)}
                        </span>
                        <button
                          className="tx-item__action-btn"
                          onClick={() => handleUndoComplete(d._id)}
                          title="Re-open"
                        >
                          <Undo2 size={14} />
                        </button>
                        <button
                          className="tx-item__action-btn tx-item__action-btn--danger"
                          onClick={() => handleDelete(d._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Sub-component for a single debt item
function DebtItem({
  debt,
  formatCurrency,
  onEdit,
  onDelete,
  onSettle,
}: {
  debt: {
    _id: Id<"debts">;
    personName: string;
    amount: number;
    type: "lent" | "borrowed";
    description?: string;
    dueDate?: number;
  };
  formatCurrency: (n: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onSettle: () => void;
}) {
  const isOverdue = debt.dueDate && debt.dueDate < Date.now();

  return (
    <div className="debt-item">
      <div className="debt-item__info">
        <span className="debt-item__person">{debt.personName}</span>
        <span className="debt-item__meta">
          {debt.description && `${debt.description} · `}
          {debt.dueDate && (
            <span className={isOverdue ? "text-danger" : ""}>
              Due {new Date(debt.dueDate).toLocaleDateString()}
            </span>
          )}
        </span>
      </div>
      <span
        className={`debt-item__amount ${
          debt.type === "lent" ? "text-income" : "text-expense"
        }`}
      >
        {formatCurrency(debt.amount)}
      </span>
      <div className="debt-item__actions">
        <button
          className="debt-item__settle-btn"
          onClick={onSettle}
          title="Mark as settled"
        >
          <CheckCircle2 size={16} />
        </button>
        <button className="tx-item__action-btn" onClick={onEdit} title="Edit">
          <Pencil size={14} />
        </button>
        <button
          className="tx-item__action-btn tx-item__action-btn--danger"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
