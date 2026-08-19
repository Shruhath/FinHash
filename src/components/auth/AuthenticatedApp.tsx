import { lazy, useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import AppShell from "../layout/AppShell";
import SplashScreen from "../ui/SplashScreen";
import DashboardPage from "../../pages/DashboardPage";

// The dashboard ships in the main bundle; everything else loads on demand.
const OnboardingPage = lazy(() => import("../../pages/OnboardingPage"));
const TransactionsPage = lazy(() => import("../../pages/TransactionsPage"));
const BudgetPage = lazy(() => import("../../pages/BudgetPage"));
const GoalsPage = lazy(() => import("../../pages/GoalsPage"));
const DebtsPage = lazy(() => import("../../pages/DebtsPage"));
const CategoriesPage = lazy(() => import("../../pages/CategoriesPage"));
const AnalyticsPage = lazy(() => import("../../pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("../../pages/SettingsPage"));

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
