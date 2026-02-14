import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { AuthProvider } from "./components/auth/AuthProvider";
import { Toaster } from "sonner";
import AuthenticatedApp from "./components/auth/AuthenticatedApp";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          } />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          },
        }}
      />
    </AuthProvider>
  );
}

function RequireGuest({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useConvexAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default App;
