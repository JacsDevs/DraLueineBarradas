import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { serverTimestamp } from "firebase/firestore";
import { uploadFileOptimized } from "../services/admin/uploads";
import { slugify } from "../utils/slugify";
import { sanitizeRichHtml } from "../utils/sanitizeHtml";
import {
  fetchPosts as fetchPostsService,
  savePost as savePostService,
  deletePost as deletePostService,
  deleteFeaturedImage
} from "../services/admin/posts";
import {
  POST_STATUSES,
  getPostStatus,
  getPostSortMillis,
  isDraftPost,
  timestampToMillis
} from "../utils/postStatus";

const POST_TABS = Object.freeze({
  PUBLISHED: "published",
  DRAFTS: "drafts"
});

export function usePosts({ user, setUploading }) {
  const [allPosts, setAllPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [editingStatus, setEditingStatus] = useState(POST_STATUSES.PUBLISHED);
  const [publishingDraftId, setPublishingDraftId] = useState("");
  const [bulkActionType, setBulkActionType] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [activePostTab, setActivePostTab] = useState(POST_TABS.PUBLISHED);
  const [postsLoading, setPostsLoading] = useState(false);

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

  useEffect(() => () => revokeFeaturedPreview(), [revokeFeaturedPreview]);

  const getCachedPostById = useCallback((id) => (
    allPosts.find((post) => post.id === id) || null
  ), [allPosts]);

  const fetchPosts = useCallback(async () => {
    if (!user?.uid) {
      setAllPosts([]);
      setPostsLoading(false);
      return;
    }

    setPostsLoading(true);

    try {
      const list = await fetchPostsService({ userId: user.uid });
      setAllPosts(list);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar posts");
    } finally {
      setPostsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setAllPosts([]);
      setPostsLoading(false);
      return;
    }

    fetchPosts();
  }, [fetchPosts, user?.uid]);

  const posts = useMemo(() => {
    const filtered = allPosts.filter((post) => (
      activePostTab === POST_TABS.DRAFTS ? isDraftPost(post) : !isDraftPost(post)
    ));

    return filtered.sort((a, b) => getPostSortMillis(b) - getPostSortMillis(a));
  }, [activePostTab, allPosts]);

  useEffect(() => {
    setSelectedPostIds((prev) => prev.filter((id) => posts.some((post) => post.id === id)));
  }, [posts]);

  const selectedPosts = useMemo(() => (
    posts.filter((post) => selectedPostIds.includes(post.id))
  ), [posts, selectedPostIds]);

  const selectedPostsCount = selectedPosts.length;
  const allVisiblePostsSelected = posts.length > 0 && selectedPostsCount === posts.length;

  const postStats = useMemo(() => {
    const publishedPosts = allPosts.filter((post) => !isDraftPost(post));
    const draftPosts = allPosts.filter((post) => isDraftPost(post));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime();

    const postsThisMonth = publishedPosts.reduce((total, post) => {
      const millis = timestampToMillis(post?.publishedAt || post?.date || post?.updatedAt || post?.createdAt);
      if (!millis) return total;
      return millis >= monthStart && millis < nextMonthStart ? total + 1 : total;
    }, 0);

    const latestPublishedPost = publishedPosts
      .slice()
      .sort((a, b) => getPostSortMillis(b) - getPostSortMillis(a))[0] || null;

    return {
      loading: postsLoading,
      totalPublished: publishedPosts.length,
      totalDrafts: draftPosts.length,
      postsThisMonth,
      latestPublishedPost
    };
  }, [allPosts, postsLoading]);

  const postTotals = useMemo(() => ({
    published: postStats.totalPublished,
    drafts: postStats.totalDrafts
  }), [postStats.totalDrafts, postStats.totalPublished]);

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

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return { blob: new Blob([bytes], { type: mime }), mime };
  }, []);

  const cleanEditorHtml = useCallback((html) => {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const normalizeLegacySpacerDivs = () => {
      const legacySpacers = Array.from(doc.querySelectorAll("div.quill-spacer"));
      legacySpacers.forEach((legacySpacer) => {
        const paragraphSpacer = doc.createElement("p");
        paragraphSpacer.classList.add("quill-spacer");
        const spacerContent = legacySpacer.innerHTML.trim();
        paragraphSpacer.innerHTML = spacerContent || "<br>";
        legacySpacer.replaceWith(paragraphSpacer);
      });
    };

    const removeEmptyParagraphs = () => {
      const paragraphs = Array.from(doc.querySelectorAll("p"));
      paragraphs.forEach((paragraph) => {
        const isSpacerParagraph = paragraph.classList.contains("quill-spacer");
        const hasOnlyBreak = paragraph.innerHTML.trim() === "<br>";
        const hasNbsp = paragraph.innerHTML.includes("&nbsp;");
        const isEmpty = paragraph.textContent.trim() === "" && !paragraph.querySelector("img, video, iframe");

        // Keep line breaks from Enter as explicit spacer paragraphs.
        if (hasOnlyBreak) {
          paragraph.classList.add("quill-spacer");
          return;
        }

        if (isSpacerParagraph && isEmpty) {
          if (!paragraph.innerHTML.trim()) paragraph.innerHTML = "<br>";
          return;
        }

        if (isEmpty && !hasNbsp) {
          paragraph.remove();
        }
      });
    };

    const removeEmptyBeforeHeadings = () => {
      const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      headings.forEach((heading) => {
        let previous = heading.previousElementSibling;

        while (
          previous
          && previous.tagName === "P"
          && !previous.classList.contains("quill-spacer")
          && previous.textContent.trim() === ""
          && !previous.querySelector("img, video, iframe")
        ) {
          const toRemove = previous;
          previous = previous.previousElementSibling;
          toRemove.remove();
        }
      });
    };

    normalizeLegacySpacerDivs();
    removeEmptyParagraphs();
    removeEmptyBeforeHeadings();

    return sanitizeRichHtml(doc.body.innerHTML);
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
      const extension = mime.split("/")[1] || "bin";
      const fileName = `${Date.now()}_${i}.${extension}`;
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

    return cleanEditorHtml(doc.body.innerHTML);
  }, [cleanEditorHtml, dataUrlToBlob]);

  const handleFeaturedImageSelect = useCallback((event) => {
    const file = event.target.files[0];
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

  const togglePostSelection = useCallback((postId) => {
    setSelectedPostIds((prev) => (
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    ));
  }, []);

  const toggleSelectAllPosts = useCallback(() => {
    const visibleIds = posts.map((post) => post.id);
    if (!visibleIds.length) return;

    setSelectedPostIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }

      return visibleIds;
    });
  }, [posts]);

  const resetForm = useCallback(() => {
    setIsEditing(null);
    setEditingStatus(POST_STATUSES.PUBLISHED);
    setTitle("");
    setSummary("");
    setContent("");
    clearFeaturedImage();
    setShowForm(false);
  }, [clearFeaturedImage]);

  const refreshPostsAfterMutation = useCallback(async (targetTab = activePostTab) => {
    setSelectedPostIds([]);
    setActivePostTab(targetTab);
    await fetchPosts();
  }, [activePostTab, fetchPosts]);

  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();
  const trimmedContent = content.trim();
  const trimmedFeaturedImage = featuredImage.trim();

  const canPublish = Boolean(
    trimmedTitle && trimmedSummary && trimmedContent && trimmedFeaturedImage
  );

  const canSaveDraft = Boolean(
    trimmedTitle || trimmedSummary || trimmedContent || trimmedFeaturedImage
  );

  const handleSavePost = useCallback(async (targetStatus = POST_STATUSES.PUBLISHED) => {
    if (!user) return;

    const nextStatus = targetStatus === POST_STATUSES.DRAFT
      ? POST_STATUSES.DRAFT
      : POST_STATUSES.PUBLISHED;
    const localTitle = title.trim();
    const localSummary = summary.trim();
    const localContent = content.trim();
    const localFeaturedImage = featuredImage.trim();
    const hasAnyField = Boolean(localTitle || localSummary || localContent || localFeaturedImage);
    const hasRequiredFields = Boolean(localTitle && localSummary && localContent && localFeaturedImage);

    if (!hasAnyField) {
      alert("Preencha pelo menos um campo antes de salvar.");
      return;
    }

    if (nextStatus === POST_STATUSES.PUBLISHED && !hasRequiredFields) {
      alert("Titulo, resumo, imagem e conteudo sao obrigatorios para publicar.");
      return;
    }

    if (!featuredFile && localFeaturedImage && !isValidImageUrl(localFeaturedImage)) {
      alert("A imagem destacada precisa ser um link valido.");
      return;
    }

    setUploading(true);

    try {
      const existingPost = isEditing ? getCachedPostById(isEditing) : null;
      const previousFeaturedImage = existingPost?.featuredImage?.trim() || "";
      let url = localFeaturedImage;

      if (featuredFile) {
        if (previousFeaturedImage) {
          try {
            await deleteFeaturedImage(previousFeaturedImage);
          } catch (error) {
            console.warn(error?.message || error);
          }
        }

        url = await uploadFileOptimized(
          featuredFile,
          `blog/featured/${Date.now()}_${featuredFile.name}`,
          { maxWidth: 1200, maxHeight: 800, maxSizeMB: 2, isImage: true }
        );
      }

      if (isEditing && !featuredFile && !url && previousFeaturedImage) {
        try {
          await deleteFeaturedImage(previousFeaturedImage);
        } catch (error) {
          console.warn(error?.message || error);
        }
      }

      const updatedContent = await uploadEmbeddedMedia(content);
      const willPublish = nextStatus === POST_STATUSES.PUBLISHED;
      const publishTimestamp = willPublish ? serverTimestamp() : null;
      const data = {
        title: localTitle,
        summary: localSummary,
        content: updatedContent || "",
        featuredImage: url || "",
        slug: localTitle ? slugify(localTitle) : "",
        status: nextStatus,
        authorId: user.uid,
        updatedAt: serverTimestamp(),
        publishedAt: publishTimestamp,
        date: publishTimestamp
      };

      if (!isEditing) {
        data.createdAt = serverTimestamp();
      }

      await savePostService({ isEditingId: isEditing, data });

      resetForm();
      await refreshPostsAfterMutation(willPublish ? POST_TABS.PUBLISHED : POST_TABS.DRAFTS);
    } catch (error) {
      console.error(error);
      alert(`Erro ao salvar post: ${error.message}`);
    } finally {
      setUploading(false);
      setFeaturedFile(null);
    }
  }, [
    user,
    title,
    summary,
    content,
    featuredImage,
    featuredFile,
    isEditing,
    isValidImageUrl,
    setUploading,
    uploadEmbeddedMedia,
    resetForm,
    getCachedPostById,
    refreshPostsAfterMutation
  ]);

  const canPublishPost = useCallback((post) => {
    if (!post) return false;
    return Boolean(
      post?.title?.trim()
      && post?.summary?.trim()
      && post?.content?.trim()
      && post?.featuredImage?.trim()
      && isValidImageUrl(post.featuredImage.trim())
    );
  }, [isValidImageUrl]);

  const publishDraftPost = useCallback(async (post) => {
    if (!user?.uid || !post?.id) return;

    await savePostService({
      isEditingId: post.id,
      data: {
        status: POST_STATUSES.PUBLISHED,
        slug: slugify(post.title.trim()),
        authorId: post.authorId || user.uid,
        publishedAt: serverTimestamp(),
        date: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    });
  }, [user?.uid]);

  const startEdit = useCallback((post) => {
    revokeFeaturedPreview();
    setIsEditing(post.id);
    setEditingStatus(getPostStatus(post));
    setTitle(post.title || "");
    setSummary(post.summary || "");
    setContent(cleanEditorHtml(post.content || ""));
    setFeaturedImage(post.featuredImage || "");
    setFeaturedFile(null);
    setFeaturedLinkDraft(post.featuredImage || "");
    setShowForm(true);
  }, [cleanEditorHtml, revokeFeaturedPreview]);

  const handlePublishDraft = useCallback(async (id) => {
    if (!user) return;

    const post = getCachedPostById(id) || posts.find((item) => item.id === id);
    if (!post) return;

    const hasRequiredFields = Boolean(
      post?.title?.trim()
      && post?.summary?.trim()
      && post?.content?.trim()
      && post?.featuredImage?.trim()
    );

    if (!hasRequiredFields) {
      alert("Preencha titulo, resumo, imagem e conteudo no rascunho antes de publicar.");
      startEdit(post);
      return;
    }

    if (!isValidImageUrl(post.featuredImage.trim())) {
      alert("A imagem destacada precisa ser um link valido para publicar.");
      startEdit(post);
      return;
    }

    setPublishingDraftId(id);
    setUploading(true);

    try {
      await publishDraftPost(post);

      await refreshPostsAfterMutation(POST_TABS.DRAFTS);
    } catch (error) {
      console.error(error);
      alert(`Erro ao publicar rascunho: ${error.message}`);
    } finally {
      setUploading(false);
      setPublishingDraftId("");
    }
  }, [getCachedPostById, isValidImageUrl, posts, publishDraftPost, refreshPostsAfterMutation, setUploading, startEdit, user]);

  const handleDelete = useCallback(async (id) => {
    const post = getCachedPostById(id) || posts.find((item) => item.id === id);
    if (!post) return;

    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      try {
        await deletePostService({ id, featuredImage: post.featuredImage });
        await refreshPostsAfterMutation(activePostTab);
      } catch (error) {
        console.error(error);
        alert(`Erro ao deletar post: ${error.message}`);
      }
    }
  }, [activePostTab, getCachedPostById, posts, refreshPostsAfterMutation]);

  const handlePublishSelectedDrafts = useCallback(async () => {
    if (!selectedPosts.length) return;

    const selectedDrafts = selectedPosts.filter((post) => isDraftPost(post));
    if (!selectedDrafts.length) return;

    const publishableDrafts = selectedDrafts.filter((post) => canPublishPost(post));
    const invalidDraftsCount = selectedDrafts.length - publishableDrafts.length;

    if (!publishableDrafts.length) {
      alert("Nenhum rascunho selecionado esta pronto para publicacao.");
      return;
    }

    const confirmMessage = publishableDrafts.length === 1
      ? "Publicar o rascunho selecionado?"
      : `Publicar ${publishableDrafts.length} rascunhos selecionados?`;

    if (!window.confirm(confirmMessage)) return;

    setBulkActionType("publish");

    try {
      for (const draft of publishableDrafts) {
        await publishDraftPost(draft);
      }

      await refreshPostsAfterMutation(POST_TABS.DRAFTS);

      if (invalidDraftsCount > 0) {
        alert(`${invalidDraftsCount} rascunho(s) selecionado(s) nao foram publicados por falta de campos obrigatorios ou imagem invalida.`);
      }
    } catch (error) {
      console.error(error);
      alert(`Erro ao publicar rascunhos: ${error.message}`);
    } finally {
      setBulkActionType("");
    }
  }, [canPublishPost, publishDraftPost, refreshPostsAfterMutation, selectedPosts]);

  const handleDeleteSelectedPosts = useCallback(async () => {
    if (!selectedPosts.length) return;

    const confirmMessage = selectedPosts.length === 1
      ? "Excluir o post selecionado?"
      : `Excluir ${selectedPosts.length} posts selecionados?`;

    if (!window.confirm(confirmMessage)) return;

    setBulkActionType("delete");

    try {
      for (const post of selectedPosts) {
        await deletePostService({ id: post.id, featuredImage: post.featuredImage });
      }

      await refreshPostsAfterMutation(activePostTab);
    } catch (error) {
      console.error(error);
      alert(`Erro ao excluir posts selecionados: ${error.message}`);
    } finally {
      setBulkActionType("");
    }
  }, [activePostTab, refreshPostsAfterMutation, selectedPosts]);

  return {
    posts,
    showForm,
    setShowForm,
    isEditing,
    editingStatus,
    activePostTab,
    setActivePostTab,
    postTotals,
    postStats,
    postsLoading,
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
    canPublish,
    canSaveDraft,
    publishingDraftId,
    bulkActionType,
    selectedPostIds,
    selectedPostsCount,
    allVisiblePostsSelected,
    handleFeaturedLinkChange,
    handleFeaturedLinkApply,
    clearFeaturedImage,
    togglePostSelection,
    toggleSelectAllPosts,
    handleFeaturedImageSelect,
    handleSavePost,
    handlePublishDraft,
    handlePublishSelectedDrafts,
    handleDelete,
    handleDeleteSelectedPosts,
    startEdit,
    resetForm,
    fetchPosts
  };
}
