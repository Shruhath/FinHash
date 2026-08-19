import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronsLeft,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Sun,
} from "lucide-react";
import Logo from "../ui/Logo";
import { PRIMARY_NAV } from "./navItems";
import { useTheme, ThemePreference } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logOut } from "../../lib/firebase";
import { initialsOf } from "../../lib/format";
import { springSnappy } from "../../lib/motion";

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAdd: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] =
  [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Auto", icon: Monitor },
  ];

export default function Sidebar({ collapsed, onToggleCollapse, onAdd }: Props) {
  const user = useCurrentUser();
  const { preference, setPreference } = useTheme();

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <Logo size={collapsed ? 30 : 26} withWordmark={!collapsed} />
        <button
          className="sidebar__collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      <button className="sidebar__add" onClick={onAdd}>
        <Plus size={18} strokeWidth={2.6} />
        {!collapsed && <span>Add transaction</span>}
      </button>

      <nav className="sidebar__nav" aria-label="Primary">
        {PRIMARY_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="sidebar__link-bg"
                    transition={springSnappy}
                  />
                )}
                <Icon size={19} strokeWidth={isActive ? 2.3 : 2} />
                <span className="sidebar__link-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="theme-switch theme-switch--full">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className={`theme-switch__btn ${preference === value ? "theme-switch__btn--active" : ""}`}
              onClick={() => setPreference(value)}
              aria-label={label}
              aria-pressed={preference === value}
              title={label}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <div className="sidebar__user">
          {user?.photoUrl ? (
            <img
              className="avatar"
              src={user.photoUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="avatar avatar--fallback">
              {initialsOf(user?.name)}
            </span>
          )}
          <div className="sidebar__user-text">
            <span className="sidebar__user-name truncate">{user?.name}</span>
            <span className="sidebar__user-email truncate">{user?.email}</span>
          </div>
          <button
            className="icon-btn icon-btn--danger sidebar__logout"
            onClick={logOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
