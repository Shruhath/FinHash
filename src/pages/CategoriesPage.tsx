import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Plus, Shapes, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import PageHeader from "../components/ui/PageHeader";
import SegmentedControl from "../components/ui/SegmentedControl";
import Sheet from "../components/ui/Sheet";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import CategoryIcon from "../components/ui/CategoryIcon";
import { SkeletonList } from "../components/ui/Skeleton";
import { ICON_CHOICES } from "../lib/categoryIcons";
import { listItemVariants, listVariants } from "../lib/motion";
import { haptic } from "../lib/haptics";
import "./CategoriesPage.css";

type Category = Doc<"categories">;

const COLOR_CHOICES = [
  "#cc5500", "#f5782a", "#f0a020", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#ef4444",
  "#78716c", "#71717a",
];

export default function CategoriesPage() {
  const categories = useQuery(api.categories.getCategories);
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_CHOICES[0]!);
  const [icon, setIcon] = useState(ICON_CHOICES[0]!);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const { visible, defaults, custom } = useMemo(() => {
    const list = (categories ?? []).filter((c) => c.type === tab);
    return {
      visible: list,
      defaults: list.filter((c) => c.isDefault),
      custom: list.filter((c) => !c.isDefault),
    };
  }, [categories, tab]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setColor(COLOR_CHOICES[0]!);
    setIcon(ICON_CHOICES[0]!);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory({
          id: editing._id,
          name: name.trim(),
          icon,
          color,
        });
        toast.success("Category updated");
      } else {
        await addCategory({ name: name.trim(), type: tab, icon, color });
        toast.success("Category created");
      }
      haptic("success");
      setFormOpen(false);
    } catch (error) {
      haptic("error");
      toast.error(
        error instanceof Error ? error.message : "Couldn't save that category"
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id as Id<"categories">;
    setPendingDelete(null);
    try {
      await deleteCategory({ id });
      haptic("success");
      toast.success("Category deleted");
    } catch (error) {
      haptic("error");
      toast.error(
        error instanceof Error && error.message.includes("transaction")
          ? "That category still has transactions linked to it"
          : "Couldn't delete that category"
      );
    }
  };

  return (
    <div className="page categories-page">
      <PageHeader
        title="Categories"
        subtitle={
          categories
            ? `${defaults.length} built-in · ${custom.length} custom`
            : "Loading…"
        }
        actions={
          <button className="btn btn--accent btn--sm" onClick={openCreate}>
            <Plus size={16} />
            New category
          </button>
        }
      />

      <SegmentedControl
        fluid
        segments={[
          { value: "expense", label: "Expenses" },
          { value: "income", label: "Income" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {categories === undefined ? (
        <div className="card">
          <SkeletonList rows={6} />
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Shapes}
            title="No categories here"
            description="Create one to start sorting your transactions."
            action={
              <button className="btn btn--accent btn--sm" onClick={openCreate}>
                Create category
              </button>
            }
          />
        </div>
      ) : (
        <motion.ul
          className="cat-grid"
          variants={listVariants}
          initial="initial"
          animate="animate"
          key={tab}
        >
          <AnimatePresence initial={false}>
            {visible.map((c) => (
              <motion.li
                className="cat-card"
                key={c._id}
                variants={listItemVariants}
                exit="exit"
                layout
              >
                <CategoryIcon
                  name={c.icon}
                  color={c.color}
                  size={19}
                  tileSize={44}
                />
                <div className="cat-card__text">
                  <span className="cat-card__name truncate">{c.name}</span>
                  {c.isDefault && <span className="badge">Built-in</span>}
                </div>
                {!c.isDefault && (
                  <div className="cat-card__actions">
                    <button
                      className="icon-btn"
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-btn icon-btn--danger"
                      onClick={() => setPendingDelete(c)}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editing
            ? "Edit category"
            : `New ${tab === "income" ? "income" : "expense"} category`
        }
        footer={
          <button
            className="btn btn--accent btn--block"
            form="category-form"
            type="submit"
            disabled={!name.trim()}
          >
            {editing ? "Save changes" : "Create category"}
          </button>
        }
      >
        <form id="category-form" className="budget-form" onSubmit={handleSubmit}>
          <div className="cat-preview">
            <CategoryIcon name={icon} color={color} size={24} tileSize={56} />
            <span className="cat-preview__name">
              {name.trim() || "Category name"}
            </span>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="cat-name">
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gym, Side hustle"
              maxLength={40}
              required
            />
          </div>

          <div className="field">
            <span className="field__label">Colour</span>
            <div className="swatches">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${color === c ? "swatch--active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    haptic("light");
                    setColor(c);
                  }}
                  aria-label={`Colour ${c}`}
                >
                  {color === c && <Check size={13} />}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Icon</span>
            <div className="icon-grid">
              {ICON_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`icon-choice ${icon === choice ? "icon-choice--active" : ""}`}
                  onClick={() => {
                    haptic("light");
                    setIcon(choice);
                  }}
                  aria-label={choice}
                  style={
                    icon === choice
                      ? ({ "--cat-color": color } as React.CSSProperties)
                      : undefined
                  }
                >
                  <CategoryIcon
                    name={choice}
                    color={icon === choice ? color : "currentColor"}
                    size={18}
                    tile={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category?"
        message={`"${pendingDelete?.name}" will be removed. Categories with transactions attached can't be deleted.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
