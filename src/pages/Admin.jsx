import { useState, useEffect, useRef, useMemo } from "react";
import { auth, db, storage } from "../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../styles/admin.css";

export default function Admin() {
  /* ================= STATES ================= */
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    displayName: "",
    photoURL: ""
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const quillRef = useRef(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setUserProfile({
          displayName: u.displayName || "",
          photoURL: u.photoURL || ""
        });
        fetchPosts();
      } else {
        setUser(null);
        setUserProfile({ displayName: "", photoURL: "" });
      }
    });
    return () => unsub();
  }, []);

  async function fetchPosts() {
    const snapshot = await getDocs(collection(db, "posts"));
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setPosts(list);
  }

  /* ================= QUILL UPLOAD ================= */
  function uploadFile(type) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;

      setUploading(true);
      const fileRef = ref(storage, `blog/${type}s/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        null,
        (err) => { console.error(err); setUploading(false); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);

          if (type === "image") quill.insertEmbed(range.index, "image", url);
          else quill.insertEmbed(range.index, "video", url);

          quill.setSelection(range.index + 1);
          setUploading(false);
        }
      );
    };
  }

  /* ================= UPLOAD IMAGEM DE DESTAQUE ================= */
  function handleFeaturedImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileRef = ref(storage, `blog/featured/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (err) => { console.error(err); setUploading(false); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFeaturedImage(url);
        setUploading(false);
      }
    );
  }

  /* ================= PROFILE IMAGE UPLOAD ================= */
  async function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const optimizedFile = await convertImageToWebP(file, 200, 200);

    const fileRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}.webp`);
    await uploadBytesResumable(fileRef, optimizedFile);

    const url = await getDownloadURL(fileRef);
    setUserProfile(prev => ({ ...prev, photoURL: url }));

    await updateProfile(user, {
      photoURL: url
    });

    setUploading(false);
  }

  function convertImageToWebP(file, width, height) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], "avatar.webp", { type: "image/webp" })),
          "image/webp",
          0.8
        );
      };
    });
  }

  async function saveUserProfile() {
    if (!user) return;

    // Atualiza Auth
    await updateProfile(user, {
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL
    });

    // Salva no Firestore
    await setDoc(
      doc(db, "admuser", user.uid),
      {
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
        email: user.email,
        updatedAt: serverTimestamp()
      },
      { merge: true } // não apaga dados antigos
    );

    alert("Perfil atualizado!");
  }

  /* ================= QUILL CONFIG ================= */
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ script: "sub" }, { script: "super" }],
        ["blockquote"],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        ["clean"]
      ],
      handlers: { image: () => uploadFile("image"), video: () => uploadFile("video") }
    }
  }), []);

  const quillFormats = [
    "header", "bold", "italic", "underline", "strike",
    "list", "bullet", "script", "blockquote", "align", "link", "image", "video"
  ];

  /* ================= POSTS ================= */
  async function handleSavePost() {
    if (!title || !summary || !content) {
      alert("Título, resumo e conteúdo são obrigatórios!");
      return;
    }

    const data = {
      title,
      summary,
      content,
      featuredImage,
      authorId: user.uid,
      authorName: userProfile.displayName || user.email,
      authorPhoto: userProfile.photoURL || "",
      date: new Date()
    };

    if (isEditing) await updateDoc(doc(db, "posts", isEditing), data);
    else await addDoc(collection(db, "posts"), data);

    resetForm();
    fetchPosts();
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      await deleteDoc(doc(db, "posts", id));
      fetchPosts();
    }
  }

  function hasProfileChanged() {
    if (!originalProfile) return false;

    return (
      originalProfile.displayName !== userProfile.displayName ||
      originalProfile.photoURL !== userProfile.photoURL
    );
  }

  function startEdit(post) {
    setIsEditing(post.id);
    setTitle(post.title);
    setSummary(post.summary);
    setContent(post.content);
    setFeaturedImage(post.featuredImage || "");
  }

  function resetForm() {
    setIsEditing(null);
    setTitle("");
    setSummary("");
    setContent("");
    setFeaturedImage("");
  }

  /* ================= LOGIN ================= */
  if (!user) {
    return (
      <div className="admin-login">
        <h3>Acesso Restrito</h3>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" onChange={e => setPassword(e.target.value)} />
        <button onClick={() => signInWithEmailAndPassword(auth, email, password)}>Entrar</button>
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <section className="admin-wrapper">
      <header className="admin-header">
        <div className="user-profile">
          {userProfile.photoURL ? (
            <img src={userProfile.photoURL} alt="Avatar" className="avatar" />
          ) : (
            <div className="avatar-placeholder">U</div>
          )}

          <div className="user-info">
            {!editingProfile ? (
              <>
                <strong className="user-name">
                  {userProfile.displayName || user.email}
                </strong>

                <button
                  className="edit-profile-link"
                  onClick={() => {
                    setOriginalProfile(userProfile);
                    setEditingProfile(true);
                  }}
                >
                  Editar perfil
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={userProfile.displayName}
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      displayName: e.target.value
                    })
                  }
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                />

                <div className="profile-actions">
                  <button
                    className="admin-btn primary"
                    disabled={!hasProfileChanged() || uploading}
                    onClick={async () => {
                      await saveUserProfile();
                      setEditingProfile(false);
                    }}
                  >
                    {uploading ? "Enviando..." : "Salvar perfil"}
                  </button>

                  <button
                    className="admin-btn cancel"
                    onClick={() => {
                      setUserProfile(originalProfile);
                      setEditingProfile(false);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <button className="admin-logout" onClick={() => signOut(auth)}>Sair</button>
      </header>

      <hr />

      <div className="post-form">
        <h3>{isEditing ? "Editar Post" : "Novo Post"}</h3>
        <input value={title} placeholder="Título" onChange={e => setTitle(e.target.value)} />
        <input value={summary} placeholder="Resumo" onChange={e => setSummary(e.target.value)} />

        <div style={{ marginBottom: "20px" }}>
          <label>Imagem de Destaque:</label>
          <input type="file" accept="image/*" onChange={handleFeaturedImageUpload} />
          {featuredImage && <img src={featuredImage} alt="Destaque" style={{ marginTop: "10px", maxWidth: "100%" }} />}
        </div>

        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={quillModules}
          formats={quillFormats}
          style={{ background: "white", color: "black", marginBottom: "20px" }}
        />

        {uploading && <p>Enviando mídia...</p>}

        <div className="admin-actions">
          <button className="admin-btn primary" onClick={handleSavePost}>
            {isEditing ? "Salvar Alterações" : "Publicar"}
          </button>
          {isEditing && <button className="admin-btn cancel" onClick={resetForm}>Cancelar</button>}
        </div>
      </div>

      <hr />

      <div className="posts-management">
        <h3>Gerenciar Posts</h3>
        {posts.map(post => (
          <div key={post.id} className="admin-post-item" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {post.featuredImage && <img src={post.featuredImage} alt="Destaque" style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />}
            <div style={{ flex: 1 }}>
              <strong>{post.title}</strong>
              <small style={{ color: "#888" }}>
                Publicado por {post.authorName} em {new Date(post.date.seconds * 1000).toLocaleString()}
              </small>
            </div>
            <div className="admin-post-actions" style={{ display: "flex", gap: "10px" }}>
              <button className="edit" onClick={() => startEdit(post)}>Editar</button>
              <button className="delete" onClick={() => handleDelete(post.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
