import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Design system first so page stylesheets can override it.
import "./index.css";
import "./components/ui/ui.css";
import App from "./App";

// Remove the pre-hydration splash once React owns the screen.
document.getElementById("boot")?.remove();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
