import { Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { useEffect, useState } from "react";

export default function ProtectedRoute() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });

    return () => unsub();
  }, []);

  // Enquanto verifica o auth
  if (user === undefined) {
    return <p style={{ padding: 20 }}>Verificando acesso...</p>;
  }

  // Não logado → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logado → libera
  return <Outlet />;
}