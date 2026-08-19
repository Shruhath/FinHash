import { useNavigate } from "react-router-dom";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import Sheet from "../ui/Sheet";
import { MORE_NAV } from "./navItems";
import { useTheme, ThemePreference } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logOut } from "../../lib/firebase";
import { initialsOf } from "../../lib/format";
import { haptic } from "../../lib/haptics";

interface Props {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] =
  [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Auto", icon: Monitor },
  ];

/** The mobile overflow menu — remaining routes, theme, account. */
export default function MoreSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { preference, setPreference } = useTheme();

  const go = (to: string) => {
    haptic("light");
    onClose();
    navigate(to);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Menu">
      <div className="more-sheet">
        <div className="more-sheet__account">
          {user?.photoUrl ? (
            <img
              className="avatar avatar--lg"
              src={user.photoUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="avatar avatar--lg avatar--fallback">
              {initialsOf(user?.name)}
            </span>
          )}
          <div className="more-sheet__account-text">
            <span className="more-sheet__name">{user?.name}</span>
            <span className="more-sheet__email truncate">{user?.email}</span>
          </div>
        </div>

        <div className="more-sheet__grid">
          {MORE_NAV.map(({ to, icon: Icon, label }) => (
            <button
              key={to}
              className="more-sheet__tile"
              onClick={() => go(to)}
            >
              <span className="more-sheet__tile-icon">
                <Icon size={20} />
              </span>
              <span className="more-sheet__tile-label">{label}</span>
            </button>
          ))}
        </div>

        <div className="more-sheet__row">
          <span className="more-sheet__row-label">Appearance</span>
          <div className="theme-switch">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                className={`theme-switch__btn ${preference === value ? "theme-switch__btn--active" : ""}`}
                onClick={() => {
                  haptic("light");
                  setPreference(value);
                }}
                aria-label={label}
                aria-pressed={preference === value}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <button
          className="more-sheet__signout"
          onClick={() => {
            haptic("warning");
            logOut();
          }}
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </Sheet>
  );
}
