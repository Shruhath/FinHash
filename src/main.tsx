import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./components/ui/ui.css";

// Remove the pre-hydration splash once React owns the screen.
document.getElementById("boot")?.remove();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
