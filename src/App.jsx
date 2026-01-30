import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Admin from "./pages/Admin";
import PublicLayout from "./layouts/PublicLayout";
import ScrollToTop from "./ScrollToTop";

export default function App(){
  return(
    <>
      <ScrollToTop />

      <Routes>
        {/* ROTAS PÚBLICAS */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Route>

        {/* ROTA ADMIN */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  )
}
