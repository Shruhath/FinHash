import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, WifiOff } from "lucide-react";
import { LogoMark } from "../ui/Logo";
import { PAGE_TITLES, TAB_ROUTES } from "./navItems";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { initialsOf } from "../../lib/format";

interface Props {
  onOpenMore: () => void;
}

/** Mobile-only header: condenses on scroll, shows a back arrow off the tabs. */
export default function TopBar({ onOpenMore }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const online = useOnlineStatus();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isTab = TAB_ROUTES.includes(pathname);
  const title = PAGE_TITLES[pathname];

  return (
    <header className={`topbar ${scrolled ? "topbar--scrolled" : ""}`}>
      <div className="topbar__inner">
        {isTab ? (
          <div className="topbar__brand">
            <LogoMark size={26} />
            <span className="topbar__brand-word">
              Fin<span className="logo__word-accent">Hash</span>
            </span>
          </div>
        ) : (
          <button
            className="icon-btn topbar__back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {!isTab && (
          <div className="topbar__title-slot">
            <AnimatePresence>
              {scrolled && title && (
                <motion.h1
                  key={title}
                  className="topbar__title"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {title}
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="topbar__right">
          {!online && (
            <span className="topbar__offline" title="Offline">
              <WifiOff size={14} />
            </span>
          )}
          <button
            className="topbar__avatar-btn"
            onClick={onOpenMore}
            aria-label="Open menu"
          >
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
          </button>
        </div>
      </div>
    </header>
  );
}
