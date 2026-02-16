import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import OnboardingPage from "../../pages/OnboardingPage";
import DashboardPage from "../../pages/DashboardPage";
import TransactionsPage from "../../pages/TransactionsPage";
import BudgetPage from "../../pages/BudgetPage";
import GoalsPage from "../../pages/GoalsPage";
import DebtsPage from "../../pages/DebtsPage";
import AnalyticsPage from "../../pages/AnalyticsPage";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <span className="loading-logo__text">Fin</span>
        <span className="loading-logo__hash">#</span>
      </div>
    </div>
  );
}

export default function AuthenticatedApp() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const seedCategories = useMutation(api.categories.seedDefaultCategories);
  const user = useQuery(api.users.currentUser);
  const seededRef = useRef(false);

  // Call storeUser once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      storeUser().catch(console.error);
    }
  }, [isAuthenticated, storeUser]);

  // Seed default categories once we have a user ID
  useEffect(() => {
    if (user?._id && !seededRef.current) {
      seededRef.current = true;
      seedCategories({ userId: user._id }).catch(console.error);
    }
  }, [user?._id, seedCategories]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user === undefined || user === null) {
    return <LoadingScreen />;
  }

  if (!user.country) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/debts" element={<DebtsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
