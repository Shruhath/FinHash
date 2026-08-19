import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import AppShell from "../layout/AppShell";
import SplashScreen from "../ui/SplashScreen";
import OnboardingPage from "../../pages/OnboardingPage";
import DashboardPage from "../../pages/DashboardPage";
import TransactionsPage from "../../pages/TransactionsPage";
import BudgetPage from "../../pages/BudgetPage";
import GoalsPage from "../../pages/GoalsPage";
import DebtsPage from "../../pages/DebtsPage";
import CategoriesPage from "../../pages/CategoriesPage";
import AnalyticsPage from "../../pages/AnalyticsPage";
import SettingsPage from "../../pages/SettingsPage";

export default function AuthenticatedApp() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const seedCategories = useMutation(api.categories.seedDefaultCategories);
  const user = useQuery(api.users.currentUser);
  const seededRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) storeUser().catch(console.error);
  }, [isAuthenticated, storeUser]);

  useEffect(() => {
    if (user?._id && !seededRef.current) {
      seededRef.current = true;
      seedCategories({ userId: user._id }).catch(console.error);
    }
  }, [user?._id, seedCategories]);

  if (authLoading) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user === undefined || user === null) return <SplashScreen />;

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
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
