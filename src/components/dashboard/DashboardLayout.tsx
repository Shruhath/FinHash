import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { Menu } from "lucide-react";
import "./DashboardLayout.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile header with hamburger */}
      <header className="mobile-header">
        <button
          className="mobile-header__menu"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-header__logo">
          <span className="mobile-header__logo-text">Fin</span>
          <span className="mobile-header__logo-hash">#</span>
        </div>
        <div className="mobile-header__spacer" />
      </header>

      <main className="dashboard-layout__main">{children}</main>
      <BottomNav />
    </div>
  );
}
