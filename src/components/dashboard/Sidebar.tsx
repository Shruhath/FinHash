import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  HandCoins,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logOut } from "../../lib/firebase";
import { useState } from "react";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/budget", icon: Wallet, label: "Budget" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/debts", icon: HandCoins, label: "Debts" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const user = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <span className="sidebar__logo-text">Fin</span>
          <span className="sidebar__logo-hash">#</span>
        </div>
        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <item.icon size={20} />
            <span className="sidebar__link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__footer-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span className="sidebar__link-label">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <div className="sidebar__user">
          {user?.photoUrl && (
            <img
              className="sidebar__avatar"
              src={user.photoUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
            />
          )}
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.name}</span>
            <span className="sidebar__user-email">{user?.email}</span>
          </div>
        </div>

        <button className="sidebar__footer-btn sidebar__logout" onClick={logOut}>
          <LogOut size={18} />
          <span className="sidebar__link-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
