import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  BarChart3,
} from "lucide-react";
import "./BottomNav.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/transactions", icon: ArrowLeftRight, label: "History" },
  { to: "/budget", icon: Wallet, label: "Budget" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav__link ${isActive ? "bottom-nav__link--active" : ""}`
          }
        >
          <item.icon size={20} />
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
