import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import ScrollToTop from "./ScrollToTop";

const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));

export default function App(){
  return(
    <>
      <ScrollToTop />

      <Suspense fallback={<div style={{ padding: 20 }}>Carregando...</div>}>
        <Routes>
          {/* ROTAS PÚBLICAS */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slugId" element={<PostDetail />} />
          </Route>

          <Route path="/login" element={<Login />} />
          
          {/* ROTAS PROTEGIDAS */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
