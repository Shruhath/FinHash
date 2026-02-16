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
  Target,
  CalendarClock,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import "./GoalsPage.css";

export default function GoalsPage() {
  const user = useCurrentUser();
  const goals = useQuery(api.savings_goals.getGoalsWithProgress) ?? [];
  const addGoal = useMutation(api.savings_goals.addGoal);
  const updateGoal = useMutation(api.savings_goals.updateGoal);
  const deleteGoal = useMutation(api.savings_goals.deleteGoal);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"savings_goals"> | null>(null);
  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const currencySymbol = user ? getCurrencyByCountry(user.country).symbol : "$";

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormTarget("");
    setFormDate("");
    setFormDescription("");
  };

  const startEdit = (g: (typeof goals)[number]) => {
    setEditingId(g._id);
    setFormName(g.name);
    setFormTarget(g.targetAmount.toString());
    setFormDate(new Date(g.targetDate).toISOString().split("T")[0]!);
    setFormDescription(g.description ?? "");
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const targetDate = new Date(formDate).getTime();
      if (editingId) {
        await updateGoal({
          id: editingId,
          name: formName,
          targetAmount: parseFloat(formTarget),
          targetDate,
          description: formDescription || undefined,
        });
        toast.success("Goal updated");
      } else {
        await addGoal({
          name: formName,
          targetAmount: parseFloat(formTarget),
          targetDate,
          description: formDescription || undefined,
        });
        toast.success("Goal created");
      }
      resetForm();
    } catch {
      toast.error("Failed to save goal");
    }
  };

  const handleDelete = async (id: Id<"savings_goals">) => {
    try {
      await deleteGoal({ id });
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <DashboardLayout>
      <div className="goals-page">
        <div className="goals-page__header">
          <div>
            <h1 className="goals-page__title">Savings Goals</h1>
            <p className="goals-page__subtitle">
              {activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className="dashboard__add-btn"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus size={20} />
            <span>Add Goal</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="budget-form-card">
            <div className="budget-form-card__header">
              <h3>{editingId ? "Edit Goal" : "New Savings Goal"}</h3>
              <button className="modal__close" onClick={resetForm}>
                <X size={18} />
              </button>
            </div>
            <form className="budget-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="form-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Goal name (e.g., Emergency Fund)"
                required
              />
              <input
                type="number"
                className="form-input"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                placeholder="Target amount"
                min="1"
                step="0.01"
                required
              />
              <input
                type="date"
                className="form-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
              <input
                type="text"
                className="form-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <button type="submit" className="btn btn--accent">
                {editingId ? "Save Changes" : "Create Goal"}
              </button>
            </form>
          </div>
        )}

        {/* Active Goals */}
        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div className="budget-empty">
            <p>No savings goals yet.</p>
            <p className="budget-empty__hint">
              Set a goal to start tracking your progress.
            </p>
          </div>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <div className="goals-grid">
                {activeGoals.map((g) => (
                  <div className="goal-card" key={g._id}>
                    <div className="goal-card__header">
                      <div className="goal-card__title-row">
                        <Target size={18} className="goal-card__icon" />
                        <h3 className="goal-card__name">{g.name}</h3>
                      </div>
                      <div className="budget-item__actions" style={{ opacity: 1 }}>
                        <button
                          className="tx-item__action-btn"
                          onClick={() => startEdit(g)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="tx-item__action-btn tx-item__action-btn--danger"
                          onClick={() => handleDelete(g._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {g.description && (
                      <p className="goal-card__description">{g.description}</p>
                    )}

                    <div className="goal-card__amounts">
                      <span className="goal-card__current">
                        {formatCurrency(g.currentAmount)}
                      </span>
                      <span className="goal-card__target">
                        / {formatCurrency(g.targetAmount)}
                      </span>
                    </div>

                    <div className="budget-item__bar-container">
                      <div
                        className="budget-item__bar budget-item__bar--safe"
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>

                    <div className="goal-card__footer">
                      <span className="goal-card__percentage">
                        {g.percentage.toFixed(1)}%
                      </span>
                      <span
                        className={`goal-card__days ${g.isOverdue ? "goal-card__days--overdue" : ""}`}
                      >
                        {g.isOverdue ? (
                          <><AlertTriangle size={12} /> Overdue</>
                        ) : (
                          <><CalendarClock size={12} /> {g.daysLeft} days left</>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <>
                <h2 className="goals-section-title">
                  <Check size={18} /> Completed
                </h2>
                <div className="goals-grid">
                  {completedGoals.map((g) => (
                    <div className="goal-card goal-card--completed" key={g._id}>
                      <div className="goal-card__header">
                        <div className="goal-card__title-row">
                          <Check size={18} className="goal-card__icon goal-card__icon--done" />
                          <h3 className="goal-card__name">{g.name}</h3>
                        </div>
                        <button
                          className="tx-item__action-btn tx-item__action-btn--danger"
                          onClick={() => handleDelete(g._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="goal-card__amounts">
                        <span className="goal-card__current text-success">
                          {formatCurrency(g.currentAmount)}
                        </span>
                        <span className="goal-card__target">
                          / {formatCurrency(g.targetAmount)}
                        </span>
                      </div>
                      <div className="budget-item__bar-container">
                        <div
                          className="budget-item__bar budget-item__bar--safe"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
