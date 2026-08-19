import {
  Baby, Book, Briefcase, Building2, Bus, Car, Coffee, CreditCard, Dumbbell,
  Film, Fuel, Gamepad2, Gift, GraduationCap, Hammer, HandCoins, Heart, Home,
  Landmark, Laptop, MoreHorizontal, Music, PawPrint, PiggyBank, Plane,
  Receipt, RotateCcw, Scissors, Shirt, ShoppingBag, ShoppingCart, Smartphone,
  Smile, Sparkles, Stethoscope, TrendingUp, Tv, Utensils, Watch, Wifi, Wrench,
  Zap, Circle, type LucideIcon,
} from "lucide-react";

/**
 * Explicit map rather than `import * as Icons` — a namespace import pulls the
 * entire lucide bundle (hundreds of kB) into the main chunk.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Baby, Book, Briefcase, Building2, Bus, Car, Coffee, CreditCard, Dumbbell,
  Film, Fuel, Gamepad2, Gift, GraduationCap, Hammer, HandCoins, Heart, Home,
  Landmark, Laptop, MoreHorizontal, Music, PawPrint, PiggyBank, Plane,
  Receipt, RotateCcw, Scissors, Shirt, ShoppingBag, ShoppingCart, Smartphone,
  Smile, Sparkles, Stethoscope, TrendingUp, Tv, Utensils, Watch, Wifi, Wrench,
  Zap, Circle,
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

export function resolveCategoryIcon(name?: string): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || Circle;
}
