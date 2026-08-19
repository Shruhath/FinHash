import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  Pencil,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { useCurrency } from "../hooks/useCurrency";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useShell } from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Sheet from "../components/ui/Sheet";
import SegmentedControl from "../components/ui/SegmentedControl";
import EmptyState from "../components/ui/EmptyState";
import CategoryIcon from "../components/ui/CategoryIcon";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { SkeletonList } from "../components/ui/Skeleton";
import EditTransactionSheet from "../components/transactions/EditTransactionSheet";
import { formatDayLabel, formatTime } from "../lib/format";
import { listItemVariants, listVariants } from "../lib/motion";
import { haptic } from "../lib/haptics";
import { parseTransactionsCsv } from "../lib/csv";
import "./TransactionsPage.css";

type TypeFilter = "all" | "income" | "expense";

/** Rows painted per batch — keeps long histories smooth on mobile. */
const PAGE_SIZE = 60;

export default function TransactionsPage() {
  const categories = useQuery(api.categories.getCategories) ?? [];
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);
  const importTransactions = useMutation(api.migration.importTransactions);
  const { format } = useCurrency();
  const { openAdd } = useShell();
  const isMobile = useIsMobile();

  // Filters are URL-backed so other pages can link straight into a slice.
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    () => (params.get("type") as TypeFilter) || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState(
    () => params.get("category") ?? ""
  );
  const [startDate, setStartDate] = useState(() => params.get("from") ?? "");
  const [endDate, setEndDate] = useState(() => params.get("to") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"transactions"> | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Doc<"transactions"> | null>(
    null
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const queryArgs: {
    type?: "income" | "expense";
    startDate?: number;
    endDate?: number;
  } = {};
  if (typeFilter !== "all") queryArgs.type = typeFilter;
  if (startDate) queryArgs.startDate = new Date(startDate).getTime();
  if (endDate) queryArgs.endDate = new Date(`${endDate}T23:59:59`).getTime();

  const transactions = useQuery(api.transactions.getTransactions, queryArgs);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c._id as string, c])),
    [categories]
  );

  const filtered = useMemo(() => {
    if (!transactions) return undefined;
    const term = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (!term) return true;
      const category = categoryById.get(t.categoryId)?.name ?? "";
      return (
        (t.description ?? "").toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        String(t.amount).includes(term)
      );
    });
  }, [transactions, search, categoryFilter, categoryById]);

  // "/" jumps to search, the way most list views behave.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
      )
        return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset paging whenever the result set changes underneath us.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, typeFilter, categoryFilter, startDate, endDate]);

  // Mirror the active filters back into the URL so the view is shareable.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (typeFilter !== "all") next.set("type", typeFilter);
    if (categoryFilter) next.set("category", categoryFilter);
    if (startDate) next.set("from", startDate);
    if (endDate) next.set("to", endDate);
    setParams(next, { replace: true });
  }, [search, typeFilter, categoryFilter, startDate, endDate, setParams]);

  const visible = useMemo(
    () => (filtered ? filtered.slice(0, visibleCount) : undefined),
    [filtered, visibleCount]
  );

  /** Group into day buckets so the list reads like a statement. */
  const groups = useMemo(() => {
    if (!visible) return [];
    const map = new Map<string, { label: string; items: Doc<"transactions">[] }>();
    for (const tx of visible) {
      const day = new Date(tx.date);
      day.setHours(0, 0, 0, 0);
      const key = String(day.getTime());
      if (!map.has(key)) map.set(key, { label: formatDayLabel(tx.date), items: [] });
      map.get(key)!.items.push(tx);
    }
    return [...map.entries()]
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([key, value]) => ({ key, ...value }));
  }, [visible]);

  const totals = useMemo(() => {
    const income = (filtered ?? [])
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = (filtered ?? [])
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id;
    setPendingDelete(null);
    try {
      await deleteTransaction({ id });
      haptic("success");
      toast.success("Transaction deleted");
    } catch {
      haptic("error");
      toast.error("Couldn't delete that transaction");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Reading file…");
    try {
      const rows = parseTransactionsCsv(await file.text());
      if (rows.length === 0) {
        toast.error("No valid rows found in that CSV", { id: toastId });
        return;
      }
      const result = await importTransactions({ transactions: rows });
      haptic("success");
      toast.success(`Imported ${result.count} transactions`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Import failed — check the CSV format", { id: toastId });
    } finally {
      e.target.value = "";
    }
  };

  const exportCsv = () => {
    const rows = filtered ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const header = "date,type,category,description,amount";
    const body = rows
      .map((t) => {
        const cat = categoryById.get(t.categoryId)?.name ?? "Unknown";
        const note = (t.description ?? "").replace(/"/g, '""');
        return `${new Date(t.date).toISOString()},${t.type},"${cat}","${note}",${t.amount}`;
      })
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finhash-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} transactions`);
  };

  return (
    <div className="page tx-page">
      <PageHeader
        title="Transactions"
        subtitle={
          filtered
            ? `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`
            : "Loading…"
        }
        actions={
          <>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => fileRef.current?.click()}
            >
              <ArrowDownToLine size={15} />
              Import
            </button>
            <button
              className="btn btn--secondary btn--sm"
              onClick={exportCsv}
              disabled={!filtered || filtered.length === 0}
            >
              <ArrowDownToLine size={15} style={{ transform: "rotate(180deg)" }} />
              Export
            </button>
            <button className="btn btn--accent btn--sm tx-page__add" onClick={() => openAdd()}>
              <Plus size={16} />
              Add
            </button>
          </>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        hidden
      />

      {/* ---------- Search + filters ---------- */}
      <div className="tx-toolbar">
        <div className="search-field">
          <Search size={16} className="search-field__icon" />
          <input
            ref={searchRef}
            type="search"
            className="search-field__input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions"
            aria-label="Search transactions"
          />
          {search && (
            <button
              className="search-field__clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          className={`filter-btn ${activeFilterCount ? "filter-btn--active" : ""}`}
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={16} />
          <span className="filter-btn__text">Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-btn__count">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {activeFilterCount > 0 && (
        <div className="hscroll tx-page__active-filters">
          {typeFilter !== "all" && (
            <FilterPill
              label={typeFilter === "income" ? "Income" : "Expenses"}
              onClear={() => setTypeFilter("all")}
            />
          )}
          {categoryFilter && (
            <FilterPill
              label={categoryById.get(categoryFilter)?.name ?? "Category"}
              onClear={() => setCategoryFilter("")}
            />
          )}
          {startDate && (
            <FilterPill label={`From ${startDate}`} onClear={() => setStartDate("")} />
          )}
          {endDate && (
            <FilterPill label={`To ${endDate}`} onClear={() => setEndDate("")} />
          )}
          <button className="chip tx-page__clear-all" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* ---------- Totals ---------- */}
      {filtered && filtered.length > 0 && (
        <div className="tx-totals">
          <div className="tx-totals__item">
            <span className="tx-totals__label">In</span>
            <span className="tx-totals__value money text-income">
              {format(totals.income, { decimals: false })}
            </span>
          </div>
          <div className="tx-totals__item">
            <span className="tx-totals__label">Out</span>
            <span className="tx-totals__value money text-expense">
              {format(totals.expense, { decimals: false })}
            </span>
          </div>
          <div className="tx-totals__item">
            <span className="tx-totals__label">Net</span>
            <span
              className={`tx-totals__value money ${totals.net >= 0 ? "text-income" : "text-expense"}`}
            >
              {format(totals.net, { decimals: false })}
            </span>
          </div>
        </div>
      )}

      {/* ---------- List ---------- */}
      {filtered === undefined ? (
        <div className="card">
          <SkeletonList rows={7} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title={
              activeFilterCount || search
                ? "Nothing matches those filters"
                : "No transactions yet"
            }
            description={
              activeFilterCount || search
                ? "Try widening your search or clearing a filter."
                : "Track your first income or expense to get started."
            }
            action={
              activeFilterCount || search ? (
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => {
                    clearFilters();
                    setSearch("");
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button className="btn btn--accent btn--sm" onClick={() => openAdd()}>
                  Add transaction
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="tx-groups">
          {groups.map((group) => {
            const dayTotal = group.items.reduce(
              (s, t) => s + (t.type === "income" ? t.amount : -t.amount),
              0
            );
            return (
              <section className="tx-group" key={group.key}>
                <header className="tx-group__header">
                  <span className="tx-group__label">{group.label}</span>
                  <span
                    className={`tx-group__total money ${dayTotal >= 0 ? "text-income" : ""}`}
                  >
                    {dayTotal >= 0 ? "+" : "−"}
                    {format(Math.abs(dayTotal))}
                  </span>
                </header>

                <motion.ul
                  className="tx-list"
                  variants={listVariants}
                  initial="initial"
                  animate="animate"
                >
                  <AnimatePresence initial={false}>
                    {group.items.map((tx) => {
                      const cat = categoryById.get(tx.categoryId);
                      return (
                        <motion.li
                          key={tx._id}
                          className="tx-row"
                          variants={listItemVariants}
                          exit="exit"
                          layout
                        >
                          <CategoryIcon
                            name={cat?.icon}
                            color={cat?.color ?? "#71717a"}
                            size={17}
                            tileSize={40}
                          />
                          <div className="tx-row__text">
                            <span className="tx-row__title truncate">
                              {tx.description || cat?.name || "Transaction"}
                            </span>
                            <span className="tx-row__meta truncate">
                              {formatTime(tx.date)} · {cat?.name ?? "Unknown"}
                              {tx.splitGroupId && (
                                <span className="badge badge--accent tx-row__split">
                                  Split
                                </span>
                              )}
                            </span>
                          </div>

                          <span
                            className={`tx-row__amount money ${tx.type === "income" ? "text-income" : ""}`}
                          >
                            {tx.type === "income" ? "+" : "−"}
                            {format(tx.amount)}
                          </span>

                          {isMobile && (
                            <button
                              className="tx-row__hit"
                              onClick={() => setEditing(tx)}
                              aria-label={`Edit ${tx.description || "transaction"}`}
                            />
                          )}

                          <div className="tx-row__actions">
                            <button
                              className="icon-btn"
                              onClick={() => setEditing(tx)}
                              aria-label="Edit transaction"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-btn icon-btn--danger"
                              onClick={() => setPendingDelete(tx)}
                              aria-label="Delete transaction"
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
          })}

          {filtered.length > visibleCount && (
            <button
              className="btn btn--secondary btn--block tx-load-more"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              <span className="text-muted">
                · {filtered.length - visibleCount} remaining
              </span>
            </button>
          )}
        </div>
      )}

      {/* ---------- Filter sheet ---------- */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <>
            <button
              className="btn btn--ghost"
              onClick={() => {
                clearFilters();
                setFiltersOpen(false);
              }}
            >
              Reset
            </button>
            <button
              className="btn btn--accent"
              onClick={() => setFiltersOpen(false)}
            >
              Show results
            </button>
          </>
        }
      >
        <div className="filter-form">
          <div className="field">
            <span className="field__label">Type</span>
            <SegmentedControl
              fluid
              segments={[
                { value: "all", label: "All" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          <div className="field">
            <span className="field__label">Category</span>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories
                .filter((c) => typeFilter === "all" || c.type === typeFilter)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-form__dates">
            <div className="field">
              <label className="field__label" htmlFor="from-date">
                From
              </label>
              <input
                id="from-date"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="to-date">
                To
              </label>
              <input
                id="to-date"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="field__label">Quick ranges</span>
            <div className="hscroll">
              {[
                { label: "This month", days: 0 },
                { label: "Last 7 days", days: 7 },
                { label: "Last 30 days", days: 30 },
                { label: "Last 90 days", days: 90 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  className="chip"
                  onClick={() => {
                    const end = new Date();
                    const start =
                      days === 0
                        ? new Date(end.getFullYear(), end.getMonth(), 1)
                        : new Date(Date.now() - days * 86_400_000);
                    setStartDate(start.toISOString().slice(0, 10));
                    setEndDate(end.toISOString().slice(0, 10));
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>

      <EditTransactionSheet
        transaction={editing}
        onClose={() => setEditing(null)}
        onDelete={(tx) => {
          setEditing(null);
          setPendingDelete(tx);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete transaction?"
        message={
          pendingDelete ? (
            <>
              <strong>
                {pendingDelete.description ||
                  categoryById.get(pendingDelete.categoryId)?.name ||
                  "This transaction"}
              </strong>{" "}
              for {format(pendingDelete.amount)} will be removed permanently.
            </>
          ) : null
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="chip chip--active filter-pill">
      {label}
      <button onClick={onClear} aria-label={`Remove ${label} filter`}>
        <X size={13} />
      </button>
    </span>
  );
}
