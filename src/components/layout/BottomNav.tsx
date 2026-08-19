import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal } from "lucide-react";
import { TAB_NAV, MORE_NAV } from "./navItems";
import { haptic } from "../../lib/haptics";
import { springSnappy } from "../../lib/motion";

interface Props {
  onAdd: () => void;
  onMore: () => void;
  moreOpen: boolean;
}

/** Mobile tab bar: three routes, a centre action button, and a More sheet. */
export default function BottomNav({ onAdd, onMore, moreOpen }: Props) {
  const { pathname } = useLocation();
  const moreActive = MORE_NAV.some((i) => pathname.startsWith(i.to));

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav__inner">
        {TAB_NAV.slice(0, 2).map((item) => (
          <Tab key={item.to} {...item} />
        ))}

        <button
          type="button"
          className="bottom-nav__fab"
          onClick={() => {
            haptic("medium");
            onAdd();
          }}
          aria-label="Add transaction"
        >
          <motion.span
            className="bottom-nav__fab-inner"
            whileTap={{ scale: 0.88 }}
            transition={springSnappy}
          >
            <Plus size={24} strokeWidth={2.5} />
          </motion.span>
        </button>

        {TAB_NAV.slice(2).map((item) => (
          <Tab key={item.to} {...item} />
        ))}

        <button
          type="button"
          className={`bottom-nav__link ${moreActive || moreOpen ? "bottom-nav__link--active" : ""}`}
          onClick={() => {
            haptic("light");
            onMore();
          }}
          aria-label="More"
          aria-expanded={moreOpen}
        >
          <span className="bottom-nav__icon">
            {(moreActive || moreOpen) && (
              <motion.span
                layoutId="tab-glow"
                className="bottom-nav__glow"
                transition={springSnappy}
              />
            )}
            <MoreHorizontal size={21} />
          </span>
          <span className="bottom-nav__label">More</span>
        </button>
      </div>
    </nav>
  );
}

function Tab({
  to,
  icon: Icon,
  label,
  shortLabel,
}: (typeof TAB_NAV)[number]) {
  return (
    <NavLink
      to={to}
      onClick={() => haptic("light")}
      className={({ isActive }) =>
        `bottom-nav__link ${isActive ? "bottom-nav__link--active" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          <span className="bottom-nav__icon">
            {isActive && (
              <motion.span
                layoutId="tab-glow"
                className="bottom-nav__glow"
                transition={springSnappy}
              />
            )}
            <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
          </span>
          <span className="bottom-nav__label">{shortLabel ?? label}</span>
        </>
      )}
    </NavLink>
  );
}
