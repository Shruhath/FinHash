import {
  LayoutGrid,
  ArrowLeftRight,
  Wallet,
  Target,
  HandCoins,
  ChartNoAxesCombined,
  Shapes,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Shorter copy for the cramped bottom bar. */
  shortLabel?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard", shortLabel: "Home" },
  {
    to: "/transactions",
    icon: ArrowLeftRight,
    label: "Transactions",
    shortLabel: "History",
  },
  { to: "/budget", icon: Wallet, label: "Budget" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/debts", icon: HandCoins, label: "Debts" },
  {
    to: "/analytics",
    icon: ChartNoAxesCombined,
    label: "Analytics",
  },
  { to: "/categories", icon: Shapes, label: "Categories" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

/** Tabs that live in the mobile bottom bar; the rest go in the More sheet. */
export const TAB_ROUTES = ["/dashboard", "/transactions", "/budget"];

export const TAB_NAV = PRIMARY_NAV.filter((i) => TAB_ROUTES.includes(i.to));
export const MORE_NAV = PRIMARY_NAV.filter((i) => !TAB_ROUTES.includes(i.to));

export const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  PRIMARY_NAV.map((i) => [i.to, i.label])
);
