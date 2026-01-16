import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Admin from "./pages/Admin";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App(){
  return(
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/post/:id" element={<PostDetail/>}/>
        <Route path="/admin" element={<Admin/>}/>
      </Routes>
      <Footer/>
    </>
  )
}
