import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import MoreSheet from "./MoreSheet";
import AddTransactionSheet from "../transactions/AddTransactionSheet";
import InstallPrompt from "../pwa/InstallPrompt";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { SkeletonCard } from "../ui/Skeleton";
import { pageVariants } from "../../lib/motion";
import "./shell.css";

export interface AddPreset {
  goalId?: string;
  type?: "income" | "expense";
  categoryId?: string;
}

interface ShellContextValue {
  openAdd: (preset?: AddPreset) => void;
}

const ShellContext = createContext<ShellContextValue>({ openAdd: () => {} });

/** Lets any page trigger the global "add transaction" sheet. */
export function useShell() {
  return useContext(ShellContext);
}

const COLLAPSE_KEY = "finhash-sidebar-collapsed";

export default function AppShell() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<AddPreset | undefined>();
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1"
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Every navigation starts at the top of the new page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  // Deep link from the PWA shortcut: /dashboard?action=add
  useEffect(() => {
    if (new URLSearchParams(location.search).get("action") === "add") {
      setAddOpen(true);
      window.history.replaceState({}, "", location.pathname);
    }
  }, [location.search, location.pathname]);

  const openAdd = useCallback((preset?: AddPreset) => {
    setAddPreset(preset);
    setAddOpen(true);
  }, []);
  const contextValue = useMemo(() => ({ openAdd }), [openAdd]);

  return (
    <ShellContext.Provider value={contextValue}>
      <div className={`shell ${collapsed ? "shell--collapsed" : ""}`}>
        {!isMobile && (
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            onAdd={openAdd}
          />
        )}

        {isMobile && <TopBar onOpenMore={() => setMoreOpen(true)} />}

        <main className="shell__main" id="main">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="shell__page"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {isMobile && (
          <BottomNav
            onAdd={openAdd}
            onMore={() => setMoreOpen(true)}
            moreOpen={moreOpen}
          />
        )}

        <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        <AddTransactionSheet
          open={addOpen}
          preset={addPreset}
          onClose={() => setAddOpen(false)}
        />
        <InstallPrompt />
      </div>
    </ShellContext.Provider>
  );
}

/** Holds the layout steady while a lazily-loaded page arrives. */
function PageFallback() {
  return (
    <div className="page">
      <SkeletonCard lines={3} height={180} />
      <SkeletonCard lines={4} />
    </div>
  );
}
