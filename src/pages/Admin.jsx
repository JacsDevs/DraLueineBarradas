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
import { signOut, updateProfile, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import ReactQuill from "react-quill";
import TextareaAutosize from "react-textarea-autosize";
import "react-quill/dist/quill.snow.css";
import "../styles/admin.css";

export default function Admin() {
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({ displayName: "", photoURL: "" });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({}); // cache de usuários para avatar dinâmico
  const [isEditing, setIsEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState(""); // URL para preview
  const [featuredFile, setFeaturedFile] = useState(null);  // arquivo real para upload

  const quillRef = useRef(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      setUser(u);
      setUserProfile({ displayName: u.displayName || "", photoURL: u.photoURL || "" });
      setUsers(prev => ({ ...prev, [u.uid]: { displayName: u.displayName || "", photoURL: u.photoURL || "" } }));
      fetchPosts();
    });
    return () => unsub();
  }, []);

  /* ================= FETCH POSTS ================= */
  async function fetchPosts() {
    try {
      const snapshot = await getDocs(collection(db, "posts"));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(list);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar posts");
    }
  }

  /* ================= UPLOAD OTIMIZADO ================= */
  async function uploadFileOptimized(file, path, options = {}) {
    const { maxWidth = 1200, maxHeight = 1200, maxSizeMB = 2, isImage = true } = options;
    if (!file) throw new Error("Nenhum arquivo selecionado");
    if (file.size > maxSizeMB * 1024 * 1024) throw new Error(`Arquivo maior que ${maxSizeMB}MB`);

    let uploadFile = file;
    if (isImage) uploadFile = await convertImageToWebP(file, maxWidth, maxHeight);

    const fileRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, uploadFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  function convertImageToWebP(file, width, height) {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        const ratio = Math.min(width / img.width, height / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name.split(".")[0] + ".webp", { type: "image/webp" })),
          "image/webp",
          0.8
        );
      };
    });
  }

  /* ================= PROFILE ================= */
  async function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const url = await uploadFileOptimized(
        file,
        `users/${user.uid}/avatar_${Date.now()}.webp`,
        { maxWidth: 150, maxHeight: 150, maxSizeMB: 1, isImage: true }
      );

      setUserProfile(prev => ({ ...prev, photoURL: url }));
      setUsers(prev => ({ ...prev, [user.uid]: { ...prev[user.uid], photoURL: url } }));
      await updateProfile(user, { photoURL: url });
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar avatar: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveUserProfile() {
    if (!user) return;
    await updateProfile(user, { displayName: userProfile.displayName, photoURL: userProfile.photoURL });
    await setDoc(
      doc(db, "admuser", user.uid),
      { displayName: userProfile.displayName, photoURL: userProfile.photoURL, email: user.email, updatedAt: serverTimestamp() },
      { merge: true }
    );
    setUsers(prev => ({ ...prev, [user.uid]: { ...userProfile } }));
    alert("Perfil atualizado!");
  }

  function hasProfileChanged() {
    if (!originalProfile) return false;
    return originalProfile.displayName !== userProfile.displayName || originalProfile.photoURL !== userProfile.photoURL;
  }

  /* ================= FEATURED IMAGE ================= */
  function handleFeaturedImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setFeaturedImage(objectUrl); // preview
    setFeaturedFile(file);       // arquivo real para upload
  }

  /* ================= POSTS ================= */
  async function handleSavePost() {
    // validação apenas ao publicar
    if (!isEditing && (!title || !summary || !content || !featuredFile)) {
      alert("Título, resumo, imagem e conteúdo são obrigatórios!");
      return;
    }

    setUploading(true);

    try {
      let url = featuredImage;

      // se estiver editando e trocar a imagem
      if (isEditing && featuredFile) {
        const post = posts.find(p => p.id === isEditing);

        if (post?.featuredImage) {
          try {
            await deleteObject(ref(storage, post.featuredImage));
          } catch (err) {
            console.warn(err.message);
          }
        }

        url = await uploadFileOptimized(
          featuredFile,
          `blog/featured/${Date.now()}_${featuredFile.name}`,
          { maxWidth: 1200, maxHeight: 800, maxSizeMB: 2, isImage: true }
        );
      }

      // se for novo post, imagem é obrigatória
      if (!isEditing && featuredFile) {
        url = await uploadFileOptimized(
          featuredFile,
          `blog/featured/${Date.now()}_${featuredFile.name}`,
          { maxWidth: 1200, maxHeight: 800, maxSizeMB: 2, isImage: true }
        );
      }

      const data = {
        ...(title && { title }),
        ...(summary && { summary }),
        ...(content && { content }),
        ...(url && { featuredImage: url }),
        authorId: user.uid,
        authorName: userProfile.displayName || user.email,
        date: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, "posts", isEditing), data);
      } else {
        await addDoc(collection(db, "posts"), data);
      }

      resetForm();
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar post: " + err.message);
    } finally {
      setUploading(false);
      setFeaturedFile(null);
    }
  }

  async function handleDelete(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      try {
        if (post.featuredImage) await deleteObject(ref(storage, post.featuredImage));
        await deleteDoc(doc(db, "posts", id));
        fetchPosts();
      } catch (err) {
        console.error(err);
        alert("Erro ao deletar post: " + err.message);
      }
    }
  }

  function startEdit(post) {
    setIsEditing(post.id);
    setTitle(post.title);
    setSummary(post.summary);
    setContent(post.content);
    setFeaturedImage(post.featuredImage || "");
    setFeaturedFile(null); // ainda não trocar arquivo
    setShowForm(true);
  }

  function resetForm() {
    setIsEditing(null);
    setTitle("");
    setSummary("");
    setContent("");
    setFeaturedImage("");
    setFeaturedFile(null);
    setShowForm(false);
  }

  /* ================= QUILL ================= */
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

  const quillFormats = ["header","bold","italic","underline","strike","list","bullet","script","blockquote","align","link","image","video"];

  function uploadFile(type) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      setUploading(true);

      try {
        const isImage = type === "image";
        const url = await uploadFileOptimized(
          file,
          `blog/${type}s/${Date.now()}_${file.name}`,
          { maxWidth: 1200, maxHeight: 1200, maxSizeMB: 2, isImage }
        );

        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        if (type === "image") quill.insertEmbed(range.index, "image", url);
        else quill.insertEmbed(range.index, "video", url);
        quill.setSelection(range.index + 1);
      } catch (err) {
        console.error(err);
        alert("Erro ao enviar mídia: " + err.message);
      } finally {
        setUploading(false);
      }
    };
  }

  /* ================= RENDER ================= */
  if (!user) return <p className="loading-text">Carregando painel...</p>;

  return (
    <section className="admin-wrapper">
      {/* Cabeçalho e perfil */}
      <header className="admin-header">
        <div className="user-profile">
          {userProfile.photoURL ? <img src={userProfile.photoURL} alt="Avatar" className="avatar" /> : <div className="avatar-placeholder">U</div>}
          <div className="user-info">
            {!editingProfile ? (
              <>
                <strong className="user-name">{userProfile.displayName || user.email}</strong>
                <button className="edit-profile-link" onClick={() => { setOriginalProfile(userProfile); setEditingProfile(true); }}>Editar perfil</button>
              </>
            ) : (
              <>
                <input type="text" placeholder="Seu nome" value={userProfile.displayName} onChange={e => setUserProfile({ ...userProfile, displayName: e.target.value })} />
                <input type="file" accept="image/*" onChange={handleProfileImageUpload} />
                <div className="profile-actions">
                  <button className="admin-btn primary" disabled={!hasProfileChanged() || uploading} onClick={async () => { await saveUserProfile(); setEditingProfile(false); }}>
                    {uploading ? "Enviando..." : "Salvar perfil"}
                  </button>
                  <button className="admin-btn cancel" onClick={() => { if (hasProfileChanged() && !window.confirm("Descartar alterações do perfil?")) return; setUserProfile(originalProfile); setEditingProfile(false); }}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
        <button className="admin-logout" onClick={() => signOut(auth)}>Sair</button>
      </header>

      {/* Formulário de Post */}
      {showForm && (
        <div className="post-form">
          <h3>{isEditing ? "Editar Post" : "Novo Post"}</h3>
          <label>Título do post:</label>
          <TextareaAutosize className="auto-textarea" value={title} placeholder="Título" onChange={e => setTitle(e.target.value)} />
          <label>Resumo do post:</label>
          <TextareaAutosize className="auto-textarea" value={summary} placeholder="Resumo" onChange={e => setSummary(e.target.value)} />

          <div className="form-section">
            <div className="featured-image-field">
              <label>Imagem de Destaque:</label>
              {!featuredImage && <input type="file" accept="image/*" onChange={handleFeaturedImageSelect} />}
              {featuredImage && (
                <div className="featured-preview">
                  <img src={featuredImage} alt="Imagem de destaque" />
                  <button type="button" className="remove-featured" onClick={() => { setFeaturedImage(""); setFeaturedFile(null); }} aria-label="Remover imagem de destaque">✕</button>
                </div>
              )}
            </div>
          </div>

          <label>Texto do post:</label>
          <ReactQuill className="quill-editor" ref={quillRef} theme="snow" value={content} onChange={setContent} modules={quillModules} formats={quillFormats} />

          {uploading && <p>Enviando mídia...</p>}

          <div className="admin-actions">
            <button className="admin-btn primary"
              onClick={handleSavePost}
              disabled={
                uploading ||
                (!isEditing && (!featuredFile || !title || !summary || !content))
              }
            >
              {isEditing ? "Salvar Alterações" : "Publicar"}
            </button>
            <button className="admin-btn cancel" onClick={() => { const hasChanges = title || summary || content || featuredImage; if (hasChanges && !window.confirm("Descartar alterações do post?")) return; resetForm(); }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de Posts */}
      {!showForm && (
        <div className="posts-management">
          <h3>Gerenciar Posts</h3>
          <div className="posts-grid">
            <div className="post-card new-post" onClick={() => { resetForm(); setShowForm(true); }}>
              <span>+ Novo Post</span>
            </div>
            {posts.map(post => (
              <div key={post.id} className="post-card">
                {post.featuredImage && <img src={post.featuredImage} alt={post.title} />}
                <div className="post-card-content">
                  <strong>{post.title}</strong>
                  <small>{new Date(post.date?.seconds * 1000).toLocaleDateString()}</small>
                </div>
                <div className="post-card-actions">
                  <button className="edit-btn" onClick={() => startEdit(post)}>Editar</button>
                  <button className="delete-btn" onClick={() => handleDelete(post.id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
