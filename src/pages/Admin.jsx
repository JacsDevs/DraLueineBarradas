import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";

export default function Admin(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [summary,setSummary]=useState("");

  async function login(){
    await signInWithEmailAndPassword(auth,email,password);
    alert("Logado");
  }

  async function savePost(){
    await addDoc(collection(db,"posts"),{title,summary,content});
    alert("Post criado");
  }

  return(
    <section>
      <h2>Admin</h2>

      <h3>Login</h3>
      <input placeholder="email" onChange={e=>setEmail(e.target.value)}/>
      <input type="password" placeholder="senha" onChange={e=>setPassword(e.target.value)}/>
      <button onClick={login}>Entrar</button>

      <h3>Novo post</h3>
      <input placeholder="Título" onChange={e=>setTitle(e.target.value)}/>
      <input placeholder="Resumo" onChange={e=>setSummary(e.target.value)}/>
      <textarea placeholder="Conteúdo" onChange={e=>setContent(e.target.value)}/>
      <button onClick={savePost}>Salvar</button>
    </section>
  )
}
