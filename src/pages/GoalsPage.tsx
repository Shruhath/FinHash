import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCurrency } from "../hooks/useCurrency";
import { useShell } from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import ProgressRing from "../components/ui/ProgressRing";
import Sheet from "../components/ui/Sheet";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import { SkeletonCard } from "../components/ui/Skeleton";
import { formatDaysLeft, toDateInput } from "../lib/format";
import { listItemVariants, listVariants } from "../lib/motion";
import { haptic } from "../lib/haptics";
import "./GoalsPage.css";

type Goal = NonNullable<
  ReturnType<typeof useQuery<typeof api.savings_goals.getGoalsWithProgress>>
>[number];

export default function GoalsPage() {
  const goals = useQuery(api.savings_goals.getGoalsWithProgress);
  const addGoal = useMutation(api.savings_goals.addGoal);
  const updateGoal = useMutation(api.savings_goals.updateGoal);
  const deleteGoal = useMutation(api.savings_goals.deleteGoal);
  const { format, compact } = useCurrency();
  const { openAdd } = useShell();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const active = useMemo(
    () => (goals ?? []).filter((g) => !g.isCompleted),
    [goals]
  );
  const completed = useMemo(
    () => (goals ?? []).filter((g) => g.isCompleted),
    [goals]
  );

  const totals = useMemo(() => {
    const saved = active.reduce((s, g) => s + g.currentAmount, 0);
    const targetSum = active.reduce((s, g) => s + g.targetAmount, 0);
    return {
      saved,
      target: targetSum,
      percentage: targetSum > 0 ? (saved / targetSum) * 100 : 0,
    };
  }, [active]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setTarget("");
    setDescription("");
    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);
    setTargetDate(toDateInput(inSixMonths.getTime()));
    setFormOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setName(goal.name);
    setTarget(String(goal.targetAmount));
    setTargetDate(toDateInput(goal.targetDate));
    setDescription(goal.description ?? "");
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      targetAmount: parseFloat(target),
      targetDate: new Date(targetDate).getTime(),
      description: description.trim() || undefined,
    };
    try {
      if (editing) {
        await updateGoal({ id: editing._id, ...payload });
        toast.success("Goal updated");
      } else {
        await addGoal(payload);
        toast.success("Goal created");
      }
      haptic("success");
      setFormOpen(false);
    } catch {
      haptic("error");
      toast.error("Couldn't save that goal");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id as Id<"savings_goals">;
    setPendingDelete(null);
    try {
      await deleteGoal({ id });
      haptic("success");
      toast.success("Goal deleted");
    } catch {
      haptic("error");
      toast.error("Couldn't delete that goal");
    }
  };

  return (
    <div className="page goals-page">
      <PageHeader
        title="Savings goals"
        subtitle={
          goals
            ? `${active.length} active${completed.length ? ` · ${completed.length} reached` : ""}`
            : "Loading…"
        }
        actions={
          <button className="btn btn--accent btn--sm" onClick={openCreate}>
            <Plus size={16} />
            New goal
          </button>
        }
      />

      {goals === undefined ? (
        <SkeletonCard lines={4} />
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Name what you're saving for, set a target, and link transactions to watch it fill up."
            action={
              <button className="btn btn--accent btn--sm" onClick={openCreate}>
                Create a goal
              </button>
            }
          />
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <motion.section
              className="goals-summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="goals-summary__main">
                <span className="goals-summary__label">Saved so far</span>
                <AnimatedNumber
                  className="goals-summary__value money"
                  value={totals.saved}
                  format={format}
                />
                <span className="goals-summary__sub">
                  of {format(totals.target)} across {active.length} goal
                  {active.length === 1 ? "" : "s"}
                </span>
              </div>
              <ProgressRing
                value={totals.percentage}
                size={92}
                thickness={9}
              >
                <span className="goals-summary__ring money">
                  {totals.percentage.toFixed(0)}%
                </span>
              </ProgressRing>
            </motion.section>
          )}

          <motion.ul
            className="goals-grid"
            variants={listVariants}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence initial={false}>
              {active.map((goal) => (
                <motion.li
                  className="goal-card"
                  key={goal._id}
                  variants={listItemVariants}
                  exit="exit"
                  layout
                >
                  <div className="goal-card__head">
                    <ProgressRing
                      value={goal.percentage}
                      size={64}
                      thickness={7}
                      color={
                        goal.isOverdue
                          ? "var(--color-danger)"
                          : "var(--color-accent)"
                      }
                    >
                      <span className="goal-card__ring money">
                        {goal.percentage.toFixed(0)}%
                      </span>
                    </ProgressRing>

                    <div className="goal-card__title">
                      <span className="goal-card__name truncate">
                        {goal.name}
                      </span>
                      <span
                        className={`goal-card__due ${goal.isOverdue ? "text-danger" : ""}`}
                      >
                        {goal.isOverdue ? (
                          <>
                            <TriangleAlert size={12} /> Past due
                          </>
                        ) : (
                          <>
                            <CalendarClock size={12} />{" "}
                            {formatDaysLeft(goal.daysLeft)}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="goal-card__actions">
                      <button
                        className="icon-btn"
                        onClick={() => openEdit(goal)}
                        aria-label={`Edit ${goal.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        onClick={() => setPendingDelete(goal)}
                        aria-label={`Delete ${goal.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="goal-card__desc">{goal.description}</p>
                  )}

                  <div className="goal-card__amounts">
                    <span className="goal-card__saved money">
                      {format(goal.currentAmount)}
                    </span>
                    <span className="goal-card__target money">
                      of {format(goal.targetAmount)}
                    </span>
                  </div>

                  <div className="goal-card__foot">
                    <span className="goal-card__left money">
                      {compact(
                        Math.max(0, goal.targetAmount - goal.currentAmount)
                      )}{" "}
                      to go
                    </span>
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => openAdd({ goalId: goal._id })}
                    >
                      <Sparkles size={14} />
                      Contribute
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          {completed.length > 0 && (
            <section className="goals-completed">
              <button
                className="collapse-toggle"
                onClick={() => setShowCompleted((v) => !v)}
                aria-expanded={showCompleted}
              >
                <Check size={16} className="text-success" />
                Reached goals ({completed.length})
                <motion.span
                  className="collapse-toggle__chevron"
                  animate={{ rotate: showCompleted ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {showCompleted && (
                  <motion.ul
                    className="goals-grid"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    {completed.map((goal) => (
                      <li className="goal-card goal-card--done" key={goal._id}>
                        <div className="goal-card__head">
                          <span className="goal-card__badge">
                            <Check size={18} />
                          </span>
                          <div className="goal-card__title">
                            <span className="goal-card__name truncate">
                              {goal.name}
                            </span>
                            <span className="goal-card__due text-success">
                              Reached
                            </span>
                          </div>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => setPendingDelete(goal)}
                            aria-label={`Delete ${goal.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="goal-card__amounts">
                          <span className="goal-card__saved money text-success">
                            {format(goal.currentAmount)}
                          </span>
                          <span className="goal-card__target money">
                            of {format(goal.targetAmount)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </section>
          )}
        </>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit goal" : "New savings goal"}
        footer={
          <button
            className="btn btn--accent btn--block"
            form="goal-form"
            type="submit"
            disabled={!name.trim() || !target || !targetDate}
          >
            {editing ? "Save changes" : "Create goal"}
          </button>
        }
      >
        <form id="goal-form" className="budget-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="goal-name">
              What are you saving for?
            </label>
            <input
              id="goal-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emergency fund, new laptop, Japan trip…"
              maxLength={60}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="goal-target">
              Target amount
            </label>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              className="form-input form-input--amount"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="goal-date">
              Target date
            </label>
            <input
              id="goal-date"
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
            <div className="hscroll">
              {[3, 6, 12, 24].map((months) => (
                <button
                  key={months}
                  type="button"
                  className="chip"
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + months);
                    setTargetDate(toDateInput(d.getTime()));
                  }}
                >
                  {months} months
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="goal-desc">
              Note
            </label>
            <input
              id="goal-desc"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional detail"
              maxLength={120}
            />
          </div>

          <p className="field__hint">
            Progress comes from transactions linked to this goal — use
            “Contribute” on the goal card or pick the goal when adding one.
          </p>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete goal?"
        message={`"${pendingDelete?.name}" will be removed. Linked transactions stay in your history.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
