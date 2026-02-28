
  import { createRoot } from "react-dom/client";
  import { Router } from "./app/Router.tsx";
  import { AuthProvider } from "./app/context/AuthContext.tsx";
  import { PaymentProvider } from "./app/context/PaymentContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <PaymentProvider>
        <Router />
      </PaymentProvider>
    </AuthProvider>
  );
  