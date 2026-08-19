import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { AuthProvider } from "./components/auth/AuthProvider";
import AuthenticatedApp from "./components/auth/AuthenticatedApp";
import UpdatePrompt from "./components/pwa/UpdatePrompt";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import AppToaster from "./components/ui/AppToaster";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <RequireGuest>
                  <LoginPage />
                </RequireGuest>
              }
            />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
          <UpdatePrompt />
        </BrowserRouter>
        <AppToaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function RequireGuest({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
