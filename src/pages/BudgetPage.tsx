import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCurrency } from "../hooks/useCurrency";
import PageHeader from "../components/ui/PageHeader";
import PeriodStepper from "../components/ui/PeriodStepper";
import ProgressBar from "../components/ui/ProgressBar";
import ProgressRing from "../components/ui/ProgressRing";
import Sheet from "../components/ui/Sheet";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import CategoryIcon from "../components/ui/CategoryIcon";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import { SkeletonCard } from "../components/ui/Skeleton";
import { MONTH_NAMES, MONTH_SHORT, monthKey, toDateInput } from "../lib/format";
import { listItemVariants, listVariants } from "../lib/motion";
import { haptic } from "../lib/haptics";
import "./BudgetPage.css";

type BudgetRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.budgets.getBudgetsWithSpending>>
>[number];

export default function BudgetPage() {
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addBudget = useMutation(api.budgets.addBudget);
  const updateBudget = useMutation(api.budgets.updateBudget);
  const deleteBudget = useMutation(api.budgets.deleteBudget);
  const { format, compact } = useCurrency();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const month = monthKey(selectedYear, selectedMonth);
  const monthStart = toDateInput(new Date(selectedYear, selectedMonth, 1).getTime());
  const monthEnd = toDateInput(
    new Date(selectedYear, selectedMonth + 1, 0).getTime()
  );

  const budgets = useQuery(api.budgets.getBudgetsWithSpending, { month });

  // Offered as a one-tap starting point when a month is still empty.
  const previousMonth = monthKey(
    new Date(selectedYear, selectedMonth - 1, 1).getFullYear(),
    new Date(selectedYear, selectedMonth - 1, 1).getMonth()
  );
  const previousBudgets =
    useQuery(
      api.budgets.getBudgetsWithSpending,
      budgets && budgets.length === 0 ? { month: previousMonth } : "skip"
    ) ?? [];
  const [copying, setCopying] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRow | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BudgetRow | null>(null);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const availableCategories = expenseCategories.filter(
    (c) => editing || !(budgets ?? []).some((b) => b.categoryId === c._id)
  );

  const totals = useMemo(() => {
    const list = budgets ?? [];
    const budgeted = list.reduce((s, b) => s + b.budgetAmount, 0);
    const spent = list.reduce((s, b) => s + b.spent, 0);
    return {
      budgeted,
      spent,
      remaining: budgeted - spent,
      percentage: budgeted > 0 ? (spent / budgeted) * 100 : 0,
    };
  }, [budgets]);

  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysLeft = isCurrentMonth
    ? Math.max(1, daysInMonth - now.getDate() + 1)
    : daysInMonth;
  const dailyAllowance = Math.max(0, totals.remaining) / daysLeft;

  const copyPreviousMonth = async () => {
    setCopying(true);
    try {
      for (const b of previousBudgets) {
        await addBudget({
          categoryId: b.categoryId,
          amount: b.budgetAmount,
          month,
          isRecurring: false,
        });
      }
      haptic("success");
      toast.success(`Copied ${previousBudgets.length} budgets`);
    } catch {
      haptic("error");
      toast.error("Couldn't copy those budgets");
    } finally {
      setCopying(false);
    }
  };

  const stepMonth = (delta: number) => {
    const next = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedMonth(next.getMonth());
    setSelectedYear(next.getFullYear());
  };

  const openCreate = () => {
    setEditing(null);
    setFormCategory("");
    setFormAmount("");
    setFormRecurring(false);
    setFormOpen(true);
  };

  const openEdit = (budget: BudgetRow) => {
    setEditing(budget);
    setFormCategory(budget.categoryId);
    setFormAmount(String(budget.budgetAmount));
    setFormRecurring(budget.isRecurring);
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateBudget({
          id: editing._id,
          amount: parseFloat(formAmount),
          isRecurring: formRecurring,
        });
        toast.success("Budget updated");
      } else {
        await addBudget({
          categoryId: formCategory as Id<"categories">,
          amount: parseFloat(formAmount),
          month,
          isRecurring: formRecurring,
        });
        toast.success("Budget set");
      }
      haptic("success");
      setFormOpen(false);
    } catch {
      haptic("error");
      toast.error("Couldn't save that budget");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { _id, isRecurring } = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteBudget({ id: _id, deleteAllFuture: isRecurring });
      haptic("success");
      toast.success("Budget removed");
    } catch {
      haptic("error");
      toast.error("Couldn't remove that budget");
    }
  };

  const overallTone =
    totals.percentage >= 100
      ? "exceeded"
      : totals.percentage >= 75
        ? "warning"
        : "safe";

  return (
    <div className="page budget-page">
      <PageHeader
        title="Budgets"
        subtitle={
          budgets
            ? `${format(totals.spent)} of ${format(totals.budgeted)} used`
            : "Loading…"
        }
        actions={
          <button className="btn btn--accent btn--sm" onClick={openCreate}>
            <Plus size={16} />
            New budget
          </button>
        }
      />

      <div className="budget-page__period">
        <PeriodStepper
          label={`${MONTH_SHORT[selectedMonth]} ${selectedYear}`}
          onPrev={() => stepMonth(-1)}
          onNext={() => stepMonth(1)}
          onReset={
            !isCurrentMonth
              ? () => {
                  setSelectedMonth(now.getMonth());
                  setSelectedYear(now.getFullYear());
                }
              : undefined
          }
        />
      </div>

      {budgets === undefined ? (
        <SkeletonCard lines={4} />
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wallet}
            title={`No budgets for ${MONTH_NAMES[selectedMonth]}`}
            description="Set a spending limit per category and FinHash will warn you before you go over."
            action={
              <div className="budget-empty__actions">
                <button className="btn btn--accent btn--sm" onClick={openCreate}>
                  Set your first budget
                </button>
                {previousBudgets.length > 0 && (
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={copyPreviousMonth}
                    disabled={copying}
                  >
                    <Copy size={15} />
                    {copying
                      ? "Copying…"
                      : `Copy ${MONTH_NAMES[new Date(selectedYear, selectedMonth - 1, 1).getMonth()]}`}
                  </button>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* ---------- Overview ---------- */}
          <motion.section
            className="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ProgressRing
              value={totals.percentage}
              size={116}
              thickness={11}
              color={
                overallTone === "exceeded"
                  ? "var(--color-danger)"
                  : overallTone === "warning"
                    ? "var(--color-warning)"
                    : "var(--color-accent)"
              }
            >
              <span className="overview__ring-value money">
                {totals.percentage.toFixed(0)}%
              </span>
              <span className="overview__ring-label">used</span>
            </ProgressRing>

            <div
              className={`overview__facts ${isCurrentMonth ? "" : "overview__facts--two"}`}
            >
              <div className="fact">
                <span className="fact__label">
                  {totals.remaining >= 0 ? "Remaining" : "Over budget"}
                </span>
                <AnimatedNumber
                  className={`fact__value money ${totals.remaining < 0 ? "text-expense" : ""}`}
                  value={Math.abs(totals.remaining)}
                  format={format}
                />
              </div>
              <div className="fact">
                <span className="fact__label">Budgeted</span>
                <span className="fact__value money">
                  {format(totals.budgeted)}
                </span>
              </div>
              {isCurrentMonth && (
                <div className="fact">
                  <span className="fact__label">Safe per day</span>
                  <span className="fact__value money">
                    {compact(dailyAllowance)}
                  </span>
                  <span className="fact__hint">{daysLeft} days left</span>
                </div>
              )}
            </div>
          </motion.section>

          {/* ---------- List ---------- */}
          <motion.ul
            className="budget-list"
            variants={listVariants}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence initial={false}>
              {[...budgets]
                .sort((a, b) => b.percentage - a.percentage)
                .map((b, i) => {
                  const remaining = b.budgetAmount - b.spent;
                  return (
                    <motion.li
                      className="budget-card"
                      key={b._id}
                      variants={listItemVariants}
                      exit="exit"
                      layout
                    >
                      <div className="budget-card__head">
                        <CategoryIcon
                          name={b.categoryIcon}
                          color={b.categoryColor}
                          size={17}
                          tileSize={38}
                        />
                        <div className="budget-card__title">
                          <Link
                            className="budget-card__name truncate"
                            to={`/transactions?category=${b.categoryId}&type=expense&from=${monthStart}&to=${monthEnd}`}
                          >
                            {b.categoryName}
                          </Link>
                          <span className="budget-card__sub">
                            <span className="truncate">
                              {remaining >= 0
                                ? `${format(remaining)} left`
                                : `${format(-remaining)} over`}
                            </span>
                            {b.isRecurring && (
                              <span
                                className="budget-card__repeat"
                                title="Repeats every month"
                              >
                                <Repeat size={11} /> monthly
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="budget-card__actions">
                          <button
                            className="icon-btn"
                            onClick={() => openEdit(b)}
                            aria-label={`Edit ${b.categoryName} budget`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => setPendingDelete(b)}
                            aria-label={`Delete ${b.categoryName} budget`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <ProgressBar
                        value={b.percentage}
                        tone={b.status}
                        delay={0.08 * i}
                      />

                      <div className="budget-card__foot">
                        <span className="budget-card__figures money">
                          {format(b.spent)}{" "}
                          <span className="text-muted">
                            of {format(b.budgetAmount)}
                          </span>
                        </span>
                        <span className={`badge badge--${statusTone(b.status)}`}>
                          {b.status === "safe" ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <AlertTriangle size={11} />
                          )}
                          {b.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
            </AnimatePresence>
          </motion.ul>
        </>
      )}

      {/* ---------- Form ---------- */}
      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit budget" : "New budget"}
        description={`${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
        footer={
          <button
            className="btn btn--accent btn--block"
            form="budget-form"
            type="submit"
            disabled={!formAmount || (!editing && !formCategory)}
          >
            {editing ? "Save changes" : "Set budget"}
          </button>
        }
      >
        <form id="budget-form" className="budget-form" onSubmit={handleSubmit}>
          {editing ? (
            <div className="budget-form__locked">
              <CategoryIcon
                name={editing.categoryIcon}
                color={editing.categoryColor}
                size={18}
                tileSize={40}
              />
              <span>{editing.categoryName}</span>
            </div>
          ) : (
            <div className="field">
              <span className="field__label">Category</span>
              {availableCategories.length === 0 ? (
                <p className="field__hint">
                  Every expense category already has a budget this month.
                </p>
              ) : (
                <div className="category-picker">
                  {availableCategories.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      className={`category-picker__item ${formCategory === c._id ? "category-picker__item--active" : ""}`}
                      onClick={() => {
                        haptic("light");
                        setFormCategory(c._id);
                      }}
                      style={
                        formCategory === c._id
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
              )}
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="budget-amount">
              Monthly limit
            </label>
            <input
              id="budget-amount"
              type="number"
              inputMode="decimal"
              className="form-input form-input--amount"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
            />
          </div>

          <label className="toggle-row">
            <span className="toggle-row__text">
              Repeat every month
              <small>Automatically carry this limit into future months</small>
            </span>
            <input
              type="checkbox"
              checked={formRecurring}
              onChange={(e) => setFormRecurring(e.target.checked)}
            />
          </label>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove budget?"
        message={
          pendingDelete?.isRecurring
            ? `This will remove the ${pendingDelete.categoryName} budget for this and all future months.`
            : `The ${pendingDelete?.categoryName} budget for this month will be removed.`
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function statusTone(status: "safe" | "warning" | "exceeded") {
  return status === "exceeded" ? "danger" : status === "warning" ? "warning" : "success";
}
