import { useState, useCallback, useEffect, useRef } from "react";
import { serverTimestamp } from "firebase/firestore";
import { uploadFileOptimized } from "../services/admin/uploads";
import { slugify } from "../utils/slugify";
import { fetchPosts as fetchPostsService, savePost as savePostService, deletePost as deletePostService, deleteFeaturedImage } from "../services/admin/posts";

export function usePosts({ user, setUploading }) {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredFile, setFeaturedFile] = useState(null);
  const [featuredLinkDraft, setFeaturedLinkDraft] = useState("");
  const featuredPreviewRef = useRef("");

  const revokeFeaturedPreview = useCallback(() => {
    if (featuredPreviewRef.current) {
      URL.revokeObjectURL(featuredPreviewRef.current);
      featuredPreviewRef.current = "";
    }
  }, []);

  useEffect(() => {
    return () => revokeFeaturedPreview();
  }, [revokeFeaturedPreview]);

  const isValidImageUrl = useCallback((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  const dataUrlToBlob = useCallback((dataUrl) => {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), mime };
  }, []);

  const cleanEditorHtml = useCallback((html) => {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const removeEmptyParagraphs = () => {
      const paragraphs = Array.from(doc.querySelectorAll("p"));
      paragraphs.forEach((p) => {
        const hasOnlyBreak = p.innerHTML.trim() === "<br>";
        const hasNbsp = p.innerHTML.includes("&nbsp;");
        const isEmpty = p.textContent.trim() === "" && !p.querySelector("img, video, iframe");
        if ((hasOnlyBreak || isEmpty) && !hasNbsp) {
          p.remove();
        }
      });
    };

    const removeEmptyBeforeHeadings = () => {
      const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      headings.forEach((heading) => {
        let prev = heading.previousElementSibling;
        while (prev && prev.tagName === "P" && prev.textContent.trim() === "" && !prev.querySelector("img, video, iframe")) {
          const toRemove = prev;
          prev = prev.previousElementSibling;
          toRemove.remove();
        }
      });
    };

    removeEmptyParagraphs();
    removeEmptyBeforeHeadings();

    return doc.body.innerHTML;
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

    const cleaned = cleanEditorHtml(doc.body.innerHTML);

    return cleaned;
  }, [cleanEditorHtml, dataUrlToBlob]);


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

    revokeFeaturedPreview();
    const objectUrl = URL.createObjectURL(file);
    featuredPreviewRef.current = objectUrl;
    setFeaturedImage(objectUrl);
    setFeaturedFile(file);
    setFeaturedLinkDraft("");
  }, [revokeFeaturedPreview]);

  const handleFeaturedLinkChange = useCallback((value) => {
    setFeaturedLinkDraft(value);
  }, []);

  const handleFeaturedLinkApply = useCallback(() => {
    const link = featuredLinkDraft.trim();

    if (!link || !isValidImageUrl(link)) {
      alert("Informe um link de imagem valido (http:// ou https://).");
      return;
    }

    revokeFeaturedPreview();
    setFeaturedImage(link);
    setFeaturedFile(null);
    setFeaturedLinkDraft(link);
  }, [featuredLinkDraft, isValidImageUrl, revokeFeaturedPreview]);

  const clearFeaturedImage = useCallback(() => {
    revokeFeaturedPreview();
    setFeaturedImage("");
    setFeaturedFile(null);
    setFeaturedLinkDraft("");
  }, [revokeFeaturedPreview]);

  const resetForm = useCallback(() => {
    setIsEditing(null);
    setTitle("");
    setSummary("");
    setContent("");
    clearFeaturedImage();
    setShowForm(false);
  }, [clearFeaturedImage]);

  const handleSavePost = useCallback(async () => {
    if (!user) return;

    if (!isEditing && (!title.trim() || !summary.trim() || !content.trim() || !featuredImage.trim())) {
      alert("Título, resumo, imagem e conteúdo são obrigatórios!");
      return;
    }

    if (!featuredFile && featuredImage.trim() && !isValidImageUrl(featuredImage.trim())) {
      alert("A imagem destacada precisa ser um link valido.");
      return;
    }

    setUploading(true);

    try {
      let url = featuredImage.trim();

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
        ...(title.trim() && { title: title.trim() }),
        ...(summary.trim() && { summary: summary.trim() }),
        ...(updatedContent && { content: updatedContent }),
        ...(url && { featuredImage: url }),
        ...(title.trim() && { slug: slugify(title.trim()) }),
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
  }, [user, isEditing, title, summary, content, featuredFile, featuredImage, isValidImageUrl, posts, setUploading, fetchPosts, uploadEmbeddedMedia, resetForm]);

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
    revokeFeaturedPreview();
    setIsEditing(post.id);
    setTitle(post.title);
    setSummary(post.summary);
    setContent(cleanEditorHtml(post.content));
    setFeaturedImage(post.featuredImage || "");
    setFeaturedFile(null);
    setFeaturedLinkDraft(post.featuredImage || "");
    setShowForm(true);
  }, [cleanEditorHtml, revokeFeaturedPreview]);

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
    featuredLinkDraft,
    handleFeaturedLinkChange,
    handleFeaturedLinkApply,
    clearFeaturedImage,
    handleFeaturedImageSelect,
    handleSavePost,
    handleDelete,
    startEdit,
    resetForm,
    fetchPosts
  };
}
