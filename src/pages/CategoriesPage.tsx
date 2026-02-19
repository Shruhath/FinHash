import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Briefcase,
    Laptop,
    TrendingUp,
    Gift,
    RotateCcw,
    MoreHorizontal,
    Utensils,
    Home,
    Car,
    ShoppingBag,
    Gamepad2,
    Heart,
    GraduationCap,
    Zap,
    ShoppingCart,
    Sparkles,
    Plane,
    CreditCard,
    Coffee,
    Music,
    Tv,
    Smartphone,
    Wifi,
    Book,
    Dumbbell,
    Stethoscope,
    Scissors,
    Shirt,
    Watch,
    Smile,
} from "lucide-react";
import { toast } from "sonner";
import "./CategoriesPage.css";

// Map of icon names to components
const ICON_MAP: Record<string, any> = {
    Briefcase,
    Laptop,
    TrendingUp,
    Gift,
    RotateCcw,
    MoreHorizontal,
    Utensils,
    Home,
    Car,
    ShoppingBag,
    Gamepad2,
    Heart,
    GraduationCap,
    Zap,
    ShoppingCart,
    Sparkles,
    Plane,
    CreditCard,
    Coffee,
    Music,
    Tv,
    Smartphone,
    Wifi,
    Book,
    Dumbbell,
    Stethoscope,
    Scissors,
    Shirt,
    Watch,
    Smile,
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

const AVAILABLE_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#eab308", // Yellow
    "#84cc16", // Lime
    "#22c55e", // Green
    "#10b981", // Emerald
    "#14b8a6", // Teal
    "#06b6d4", // Cyan
    "#0ea5e9", // Sky
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#a855f7", // Purple
    "#d946ef", // Fuchsia
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#71717a", // Zinc
];

export default function CategoriesPage() {
    const categories = useQuery(api.categories.getCategories) ?? [];
    const addCategory = useMutation(api.categories.addCategory);
    const updateCategory = useMutation(api.categories.updateCategory);
    const deleteCategory = useMutation(api.categories.deleteCategory);

    const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);

    // Form State
    const [formName, setFormName] = useState("");
    const [formIcon, setFormIcon] = useState("MoreHorizontal");
    const [formColor, setFormColor] = useState(AVAILABLE_COLORS[0]);

    const filteredCategories = categories.filter((c) => c.type === activeTab);

    const resetForm = () => {
        setShowModal(false);
        setEditingId(null);
        setFormName("");
        setFormIcon("MoreHorizontal");
        setFormColor(AVAILABLE_COLORS[0]);
    };

    const startEdit = (c: (typeof categories)[number]) => {
        setEditingId(c._id);
        setFormName(c.name);
        setFormIcon(c.icon);
        setFormColor(c.color);
        setShowModal(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCategory({
                    id: editingId,
                    name: formName,
                    icon: formIcon,
                    color: formColor,
                });
                toast.success("Category updated");
            } else {
                await addCategory({
                    name: formName,
                    type: activeTab,
                    icon: formIcon,
                    color: formColor,
                });
                toast.success("Category added");
            }
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save category");
        }
    };

    const handleDelete = async (id: Id<"categories">) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            await deleteCategory({ id });
            toast.success("Category deleted");
        } catch (error: any) {
            // Backend throws specific errors if linked to transactions/budgets
            toast.error(error.message || "Failed to delete category");
        }
    };

    const IconComponent = ({ name, size = 18, color }: { name: string; size?: number; color?: string }) => {
        const Icon = ICON_MAP[name] || MoreHorizontal;
        return <Icon size={size} color={color} />;
    };

    return (
        <DashboardLayout>
            <div className="categories-page">
                <div className="categories-page__header">
                    <div>
                        <h1 className="categories-page__title">Categories</h1>
                        <p className="categories-page__subtitle">
                            Manage your income and expense categories
                        </p>
                    </div>
                    <button
                        className="categories-page__add-btn"
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                    >
                        <Plus size={18} />
                        <span>Add Category</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="categories-tabs">
                    <button
                        className={`categories-tabs__btn ${activeTab === "expense" ? "categories-tabs__btn--active" : ""}`}
                        onClick={() => setActiveTab("expense")}
                    >
                        Expenses
                    </button>
                    <button
                        className={`categories-tabs__btn ${activeTab === "income" ? "categories-tabs__btn--active" : ""}`}
                        onClick={() => setActiveTab("income")}
                    >
                        Income
                    </button>
                </div>

                {/* Grid */}
                {filteredCategories.length === 0 ? (
                    <div className="categories-empty">
                        <p>No custom categories found.</p>
                        <p className="categories-empty__hint">
                            Create one to start tracking!
                        </p>
                    </div>
                ) : (
                    <div className="categories-grid">
                        {filteredCategories.map((cat) => (
                            <div key={cat._id} className="category-card">
                                <div
                                    className="category-card__icon"
                                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                >
                                    <IconComponent name={cat.icon} size={20} />
                                </div>
                                <div className="category-card__details">
                                    <div className="category-card__name">
                                        {cat.name}
                                        {cat.isDefault && (
                                            <span className="category-card__badge">Default</span>
                                        )}
                                    </div>
                                </div>
                                {!cat.isDefault && (
                                    <div className="category-card__actions">
                                        <button
                                            className="category-card__action-btn"
                                            onClick={() => startEdit(cat)}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className="category-card__action-btn category-card__action-btn--delete"
                                            onClick={() => handleDelete(cat._id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="budget-form-card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '500px', zIndex: 1000, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="budget-form-card__header">
                            <h3>{editingId ? "Edit Category" : `New ${activeTab === 'income' ? 'Income' : 'Expense'} Category`}</h3>
                            <button className="modal__close" onClick={resetForm}>
                                <X size={18} />
                            </button>
                        </div>
                        <form className="budget-form" onSubmit={handleSubmit}>
                            <div className="cat-form__group">
                                <label className="cat-form__label">Category Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g., Gym, Side Hustle"
                                    required
                                />
                            </div>

                            <div className="color-picker">
                                <label className="color-picker__label">Color</label>
                                <div className="color-picker__row">
                                    {AVAILABLE_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`color-picker__swatch ${formColor === c ? "color-picker__swatch--selected" : ""}`}
                                            style={{ backgroundColor: c, color: c }}
                                            onClick={() => setFormColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="icon-picker">
                                <label className="icon-picker__label">Icon</label>
                                <div className="icon-picker__grid">
                                    {AVAILABLE_ICONS.map((iconName) => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            className={`icon-picker__item ${formIcon === iconName ? "icon-picker__item--selected" : ""}`}
                                            onClick={() => setFormIcon(iconName)}
                                        >
                                            <IconComponent name={iconName} size={20} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn--accent" style={{ marginTop: '1rem' }}>
                                {editingId ? "Save Changes" : "Create Category"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Backdrop for modal */}
                {showModal && (
                    <div
                        className="sidebar-overlay"
                        style={{ display: 'block', zIndex: 999 }}
                        onClick={resetForm}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
