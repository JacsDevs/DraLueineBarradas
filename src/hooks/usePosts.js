import { useState, useCallback } from "react";
import { serverTimestamp } from "firebase/firestore";
import { uploadFileOptimized } from "../services/admin/uploads";
import { slugify } from "../utils/slugify";
import { fetchPosts as fetchPostsService, savePost as savePostService, deletePost as deletePostService, deleteFeaturedImage } from "../services/admin/posts";

export function usePosts({ user, userProfile, setUploading }) {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredFile, setFeaturedFile] = useState(null);

  const dataUrlToBlob = useCallback((dataUrl) => {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), mime };
  }, []);

  const uploadEmbeddedMedia = useCallback(async (html) => {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const mediaNodes = Array.from(doc.querySelectorAll("img, video"));

    for (let i = 0; i < mediaNodes.length; i += 1) {
      const node = mediaNodes[i];
      const src = node.getAttribute("src");
      if (!src || !src.startsWith("data:")) continue;

      const isImage = node.tagName.toLowerCase() === "img";
      const { blob, mime } = dataUrlToBlob(src);
      const ext = mime.split("/")[1] || "bin";
      const fileName = `${Date.now()}_${i}.${ext}`;
      const file = new File([blob], fileName, { type: mime });
      const path = `blog/${isImage ? "images" : "videos"}/${fileName}`;

      const url = await uploadFileOptimized(file, path, {
        maxWidth: 1200,
        maxHeight: 1200,
        maxSizeMB: 2,
        isImage
      });

      node.setAttribute("src", url);
    }

    return doc.body.innerHTML;
  }, [dataUrlToBlob]);

  const fetchPosts = useCallback(async () => {
    try {
      const list = await fetchPostsService({ userId: user?.uid });
      setPosts(list);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar posts");
    }
  }, [user?.uid]);

  const handleFeaturedImageSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setFeaturedImage(objectUrl);
    setFeaturedFile(file);
  }, []);

  const handleSavePost = useCallback(async () => {
    if (!user) return;

    if (!isEditing && (!title || !summary || !content || !featuredFile)) {
      alert("Título, resumo, imagem e conteúdo são obrigatórios!");
      return;
    }

    setUploading(true);

    try {
      let url = featuredImage;

      if (isEditing && featuredFile) {
        const post = posts.find(p => p.id === isEditing);
        if (post?.featuredImage) {
          try {
            await deleteFeaturedImage(post.featuredImage);
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

      if (!isEditing && featuredFile) {
        url = await uploadFileOptimized(
          featuredFile,
          `blog/featured/${Date.now()}_${featuredFile.name}`,
          { maxWidth: 1200, maxHeight: 800, maxSizeMB: 2, isImage: true }
        );
      }

      const updatedContent = await uploadEmbeddedMedia(content);

      const data = {
        ...(title && { title }),
        ...(summary && { summary }),
        ...(updatedContent && { content: updatedContent }),
        ...(url && { featuredImage: url }),
        ...(title && { slug: slugify(title) }),
        authorId: user.uid,
        date: serverTimestamp()
      };

      await savePostService({ isEditingId: isEditing, data });

      resetForm();
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar post: " + err.message);
    } finally {
      setUploading(false);
      setFeaturedFile(null);
    }
  }, [user, isEditing, title, summary, content, featuredFile, featuredImage, posts, userProfile, setUploading, fetchPosts, uploadEmbeddedMedia]);

  const handleDelete = useCallback(async (id) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      try {
        await deletePostService({ id, featuredImage: post.featuredImage });
        fetchPosts();
      } catch (err) {
        console.error(err);
        alert("Erro ao deletar post: " + err.message);
      }
    }
  }, [posts, fetchPosts]);

  const startEdit = useCallback((post) => {
    setIsEditing(post.id);
    setTitle(post.title);
    setSummary(post.summary);
    setContent(post.content);
    setFeaturedImage(post.featuredImage || "");
    setFeaturedFile(null);
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setIsEditing(null);
    setTitle("");
    setSummary("");
    setContent("");
    setFeaturedImage("");
    setFeaturedFile(null);
    setShowForm(false);
  }, []);

  return {
    posts,
    showForm,
    setShowForm,
    isEditing,
    title,
    setTitle,
    summary,
    setSummary,
    content,
    setContent,
    featuredImage,
    setFeaturedImage,
    featuredFile,
    setFeaturedFile,
    handleFeaturedImageSelect,
    handleSavePost,
    handleDelete,
    startEdit,
    resetForm,
    fetchPosts
  };
}
