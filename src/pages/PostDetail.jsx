import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useEffect, useState } from "react";

export default function PostDetail(){
  const { id } = useParams();
  const [post,setPost]=useState(null);

  useEffect(()=>{
    async function load(){
      const ref = doc(db,"posts",id);
      const snapshot = await getDoc(ref);
      setPost(snapshot.data());
    }
    load();
  },[])

  if(!post) return <p>Carregando...</p>

  return(
    <section>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </section>
  )
}
