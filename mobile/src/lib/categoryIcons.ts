import {
  Baby, Book, Briefcase, Building2, Bus, Car, Circle, Coffee, CreditCard,
  Dumbbell, Film, Fuel, Gamepad2, Gift, GraduationCap, Hammer, HandCoins,
  Heart, Home, Landmark, Laptop, MoreHorizontal, Music, PawPrint, PiggyBank,
  Plane, Receipt, RotateCcw, Scissors, Shirt, ShoppingBag, ShoppingCart,
  Smartphone, Smile, Sparkles, Stethoscope, TrendingUp, Tv, Utensils, Watch,
  Wifi, Wrench, Zap, type LucideIcon,
} from "lucide-react-native";

/** Explicit map — a namespace import would pull the whole icon set into the bundle. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Baby, Book, Briefcase, Building2, Bus, Car, Circle, Coffee, CreditCard,
  Dumbbell, Film, Fuel, Gamepad2, Gift, GraduationCap, Hammer, HandCoins,
  Heart, Home, Landmark, Laptop, MoreHorizontal, Music, PawPrint, PiggyBank,
  Plane, Receipt, RotateCcw, Scissors, Shirt, ShoppingBag, ShoppingCart,
  Smartphone, Smile, Sparkles, Stethoscope, TrendingUp, Tv, Utensils, Watch,
  Wifi, Wrench, Zap,
};

/** Names offered in the category picker, in display order. */
export const ICON_CHOICES = [
  "Utensils", "Coffee", "ShoppingCart", "ShoppingBag", "Home", "Car",
  "Bus", "Plane", "Fuel", "Zap", "Wifi", "Smartphone",
  "Tv", "Music", "Gamepad2", "Film", "Book", "GraduationCap",
  "Heart", "Stethoscope", "Dumbbell", "Scissors", "Shirt", "Watch",
  "Sparkles", "Gift", "PawPrint", "Baby", "Wrench", "Hammer",
  "CreditCard", "Landmark", "PiggyBank", "TrendingUp", "Briefcase", "Laptop",
  "Building2", "Receipt", "RotateCcw", "Smile", "MoreHorizontal",
];

export const COLOR_CHOICES = [
  "#cc5500", "#f5782a", "#f0a020", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#ef4444",
  "#78716c", "#71717a",
];

export function resolveCategoryIcon(name?: string): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || Circle;
}
