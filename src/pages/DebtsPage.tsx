import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  ChevronDown,
  HandCoins,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useCurrency } from "../hooks/useCurrency";
import PageHeader from "../components/ui/PageHeader";
import SegmentedControl from "../components/ui/SegmentedControl";
import Sheet from "../components/ui/Sheet";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import { SkeletonCard } from "../components/ui/Skeleton";
import { formatDayLabel, initialsOf, toDateInput } from "../lib/format";
import { listItemVariants, listVariants } from "../lib/motion";
import { haptic } from "../lib/haptics";
import "./DebtsPage.css";

type Debt = Doc<"debts">;

export default function DebtsPage() {
  const debts = useQuery(api.debts.getDebts);
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addDebt = useMutation(api.debts.addDebt);
  const updateDebt = useMutation(api.debts.updateDebt);
  const deleteDebt = useMutation(api.debts.deleteDebt);
  const markComplete = useMutation(api.debts.markComplete);
  const undoComplete = useMutation(api.debts.undoComplete);
  const { format } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [settling, setSettling] = useState<Debt | null>(null);
  const [settleCategory, setSettleCategory] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { toReceive, toPay, completed, totals } = useMemo(() => {
    const list = debts ?? [];
    const open = list.filter((d) => !d.isCompleted);
    const receive = open.filter((d) => d.type === "lent");
    const pay = open.filter((d) => d.type === "borrowed");
    return {
      toReceive: receive,
      toPay: pay,
      completed: list.filter((d) => d.isCompleted),
      totals: {
        receive: receive.reduce((s, d) => s + d.amount, 0),
        pay: pay.reduce((s, d) => s + d.amount, 0),
      },
    };
  }, [debts]);

  const net = totals.receive - totals.pay;

  const openCreate = () => {
    setEditing(null);
    setType("lent");
    setPerson("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setFormOpen(true);
  };

  const openEdit = (debt: Debt) => {
    setEditing(debt);
    setType(debt.type);
    setPerson(debt.personName);
    setAmount(String(debt.amount));
    setDescription(debt.description ?? "");
    setDueDate(debt.dueDate ? toDateInput(debt.dueDate) : "");
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      personName: person.trim(),
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
    };
    try {
      if (editing) {
        await updateDebt({ id: editing._id, ...payload });
        toast.success("Debt updated");
      } else {
        await addDebt({ type, ...payload });
        toast.success("Debt tracked");
      }
      haptic("success");
      setFormOpen(false);
    } catch {
      haptic("error");
      toast.error("Couldn't save that debt");
    }
  };

  const settle = async (recordAsTransaction: boolean) => {
    if (!settling) return;
    const debt = settling;
    setSettling(null);
    try {
      await markComplete({
        id: debt._id,
        recordAsTransaction,
        categoryId: recordAsTransaction && settleCategory
          ? (settleCategory as Id<"categories">)
          : undefined,
      });
      haptic("success");
      toast.success(`Settled with ${debt.personName}`);
    } catch {
      haptic("error");
      toast.error("Couldn't settle that debt");
    } finally {
      setSettleCategory("");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id;
    setPendingDelete(null);
    try {
      await deleteDebt({ id });
      haptic("success");
      toast.success("Debt removed");
    } catch {
      haptic("error");
      toast.error("Couldn't remove that debt");
    }
  };

  const settleCategoryOptions = categories.filter(
    (c) => c.type === (settling?.type === "lent" ? "income" : "expense")
  );

  return (
    <div className="page debts-page">
      <PageHeader
        title="Debts & loans"
        subtitle={
          debts
            ? `${toReceive.length + toPay.length} open · ${completed.length} settled`
            : "Loading…"
        }
        actions={
          <button className="btn btn--accent btn--sm" onClick={openCreate}>
            <Plus size={16} />
            Track debt
          </button>
        }
      />

      {debts === undefined ? (
        <SkeletonCard lines={4} />
      ) : debts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HandCoins}
            title="Nothing tracked yet"
            description="Keep tabs on money you've lent out or borrowed, and settle it in one tap."
            action={
              <button className="btn btn--accent btn--sm" onClick={openCreate}>
                Track a debt
              </button>
            }
          />
        </div>
      ) : (
        <>
          {(toReceive.length > 0 || toPay.length > 0) && (
            <motion.section
              className="debts-summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="debts-summary__net">
                <span className="debts-summary__net-label">
                  {net >= 0 ? "Net owed to you" : "Net you owe"}
                </span>
                <AnimatedNumber
                  className={`debts-summary__net-value money ${net >= 0 ? "text-income" : "text-expense"}`}
                  value={Math.abs(net)}
                  format={format}
                />
              </div>

              <div className="debts-summary__split">
                <div className="debts-summary__card">
                  <span className="debts-summary__icon debts-summary__icon--in">
                    <ArrowDownLeft size={16} />
                  </span>
                  <div>
                    <span className="debts-summary__label">To receive</span>
                    <span className="debts-summary__value money text-income">
                      {format(totals.receive)}
                    </span>
                  </div>
                </div>
                <div className="debts-summary__card">
                  <span className="debts-summary__icon debts-summary__icon--out">
                    <ArrowUpRight size={16} />
                  </span>
                  <div>
                    <span className="debts-summary__label">To pay</span>
                    <span className="debts-summary__value money text-expense">
                      {format(totals.pay)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {toReceive.length > 0 && (
            <DebtSection
              title="To receive"
              icon={<ArrowDownLeft size={15} className="text-income" />}
              debts={toReceive}
              format={format}
              onEdit={openEdit}
              onDelete={setPendingDelete}
              onSettle={setSettling}
            />
          )}

          {toPay.length > 0 && (
            <DebtSection
              title="To pay"
              icon={<ArrowUpRight size={15} className="text-expense" />}
              debts={toPay}
              format={format}
              onEdit={openEdit}
              onDelete={setPendingDelete}
              onSettle={setSettling}
            />
          )}

          {completed.length > 0 && (
            <section className="goals-completed">
              <button
                className="collapse-toggle"
                onClick={() => setShowCompleted((v) => !v)}
                aria-expanded={showCompleted}
              >
                <Check size={16} className="text-success" />
                Settled ({completed.length})
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
                    className="debt-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    {completed.map((d) => (
                      <li className="debt-row debt-row--done" key={d._id}>
                        <span className="debt-row__avatar">
                          {initialsOf(d.personName)}
                        </span>
                        <div className="debt-row__text">
                          <span className="debt-row__person truncate">
                            {d.personName}
                          </span>
                          <span className="debt-row__meta">
                            {d.type === "lent" ? "Received" : "Paid"}
                            {d.completedDate &&
                              ` · ${formatDayLabel(d.completedDate)}`}
                          </span>
                        </div>
                        <span className="debt-row__amount money">
                          {format(d.amount)}
                        </span>
                        <div className="debt-row__actions">
                          <button
                            className="icon-btn"
                            onClick={async () => {
                              await undoComplete({ id: d._id });
                              toast.success("Debt reopened");
                            }}
                            aria-label="Reopen"
                          >
                            <Undo2 size={15} />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => setPendingDelete(d)}
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* ---------- Add / edit ---------- */}
      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit debt" : "Track a debt"}
        footer={
          <button
            className="btn btn--accent btn--block"
            form="debt-form"
            type="submit"
            disabled={!person.trim() || !amount}
          >
            {editing ? "Save changes" : "Track it"}
          </button>
        }
      >
        <form id="debt-form" className="budget-form" onSubmit={handleSubmit}>
          {!editing && (
            <SegmentedControl
              fluid
              segments={[
                { value: "lent", label: "I lent out" },
                { value: "borrowed", label: "I borrowed" },
              ]}
              value={type}
              onChange={setType}
            />
          )}

          <div className="field">
            <label className="field__label" htmlFor="debt-person">
              Person
            </label>
            <input
              id="debt-person"
              type="text"
              className="form-input"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Who is it with?"
              maxLength={60}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="debt-amount">
              Amount
            </label>
            <input
              id="debt-amount"
              type="number"
              inputMode="decimal"
              className="form-input form-input--amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="debt-note">
              What for?
            </label>
            <input
              id="debt-note"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note"
              maxLength={120}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="debt-due">
              Due date
            </label>
            <input
              id="debt-due"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </form>
      </Sheet>

      {/* ---------- Settle ---------- */}
      <Sheet
        open={!!settling}
        onClose={() => setSettling(null)}
        title="Settle this debt"
        description={
          settling
            ? `${format(settling.amount)} with ${settling.personName}`
            : undefined
        }
        size="sm"
      >
        <div className="settle">
          <p className="settle__lead">
            Want this recorded as a{" "}
            {settling?.type === "lent" ? "income" : "expense"} transaction too?
          </p>

          <div className="field">
            <span className="field__label">Category for the transaction</span>
            <select
              className="form-input"
              value={settleCategory}
              onChange={(e) => setSettleCategory(e.target.value)}
            >
              <option value="">Auto-pick</option>
              {settleCategoryOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="settle__actions">
            <button className="btn btn--accent btn--block" onClick={() => settle(true)}>
              Settle & record
            </button>
            <button
              className="btn btn--secondary btn--block"
              onClick={() => settle(false)}
            >
              Just mark settled
            </button>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this record?"
        message={`The debt with ${pendingDelete?.personName} will be removed permanently.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function DebtSection({
  title,
  icon,
  debts,
  format,
  onEdit,
  onDelete,
  onSettle,
}: {
  title: string;
  icon: React.ReactNode;
  debts: Debt[];
  format: (v: number) => string;
  onEdit: (d: Debt) => void;
  onDelete: (d: Debt) => void;
  onSettle: (d: Debt) => void;
}) {
  return (
    <section className="debt-section">
      <h2 className="section-title">
        {icon}
        {title}
      </h2>
      <motion.ul
        className="debt-list"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence initial={false}>
          {debts.map((d) => {
            const overdue = d.dueDate ? d.dueDate < Date.now() : false;
            return (
              <motion.li
                className="debt-row"
                key={d._id}
                variants={listItemVariants}
                exit="exit"
                layout
              >
                <span
                  className={`debt-row__avatar ${d.type === "lent" ? "debt-row__avatar--in" : "debt-row__avatar--out"}`}
                >
                  {initialsOf(d.personName)}
                </span>

                <div className="debt-row__text">
                  <span className="debt-row__person truncate">
                    {d.personName}
                  </span>
                  <span className="debt-row__meta truncate">
                    {d.description || (d.type === "lent" ? "Lent out" : "Borrowed")}
                    {d.dueDate && (
                      <span className={overdue ? "text-danger" : ""}>
                        {" · "}
                        {overdue ? (
                          <TriangleAlert size={11} style={{ display: "inline" }} />
                        ) : (
                          <CalendarClock size={11} style={{ display: "inline" }} />
                        )}{" "}
                        {formatDayLabel(d.dueDate)}
                      </span>
                    )}
                  </span>
                </div>

                <span
                  className={`debt-row__amount money ${d.type === "lent" ? "text-income" : "text-expense"}`}
                >
                  {format(d.amount)}
                </span>

                <div className="debt-row__actions">
                  <button
                    className="icon-btn debt-row__settle"
                    onClick={() => onSettle(d)}
                    aria-label="Settle"
                    title="Settle"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => onEdit(d)}
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => onDelete(d)}
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </section>
  );
}
