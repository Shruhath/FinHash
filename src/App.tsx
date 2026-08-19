import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/auth/AuthProvider";
import AuthenticatedApp from "./components/auth/AuthenticatedApp";
import UpdatePrompt from "./components/pwa/UpdatePrompt";
import LoginPage from "./pages/LoginPage";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  return (
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
  );
}

function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={theme}
      richColors
      closeButton
      offset={16}
      toastOptions={{
        style: {
          background: "var(--color-bg-glass)",
          backdropFilter: "blur(18px) saturate(180%)",
          border: "1px solid var(--color-border-light)",
          color: "var(--color-text-primary)",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}

function RequireGuest({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
