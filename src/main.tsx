
  import { createRoot } from "react-dom/client";
  import { Router } from "./app/Router.tsx";
  import { AuthProvider } from "./app/context/AuthContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
  