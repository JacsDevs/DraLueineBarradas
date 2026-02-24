import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../services/firebase";

const deleteRefsInChunks = async (refs) => {
  if (!refs.length) return;

  const chunkSize = 450;

  for (let i = 0; i < refs.length; i += chunkSize) {
    const chunk = refs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};

const buildCommentThreads = (items) => {
  const topLevel = [];
  const repliesByParent = new Map();

  items.forEach((item) => {
    if (item.parentId) {
      const current = repliesByParent.get(item.parentId) || [];
      current.push(item);
      repliesByParent.set(item.parentId, current);
      return;
    }

    topLevel.push(item);
  });

  return topLevel.map((item) => ({
    ...item,
    replies: repliesByParent.get(item.id) || []
  }));
};

const normalizeComment = (id, data) => ({
  id,
  name: data?.name || "Visitante",
  email: data?.email || "",
  message: data?.message || "",
  parentId: data?.parentId || null,
  createdAt: data?.createdAt || null,
  isAdminReply: Boolean(data?.isAdminReply)
});

export function usePostComments({ user, posts, adminDisplayName = "" }) {
  const [activeCommentsPostId, setActiveCommentsPostId] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [replyParentId, setReplyParentId] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");

  useEffect(() => {
    if (!activeCommentsPostId) return;

    const existsInList = posts.some((post) => post.id === activeCommentsPostId);
    if (!existsInList) {
      setActiveCommentsPostId("");
      setReplyParentId("");
      setReplyMessage("");
    }
  }, [activeCommentsPostId, posts]);

  useEffect(() => {
    let unsubscribe = () => {};

    if (!activeCommentsPostId) {
      setComments([]);
      setCommentsLoading(false);
      setCommentsError("");
      setReplyParentId("");
      setReplyMessage("");
      return () => unsubscribe();
    }

    setComments([]);
    setCommentsLoading(true);
    setCommentsError("");
    setReplyParentId("");
    setReplyMessage("");

    const commentsRef = collection(db, "posts", activeCommentsPostId, "comments");
    const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));

    unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docItem) => normalizeComment(docItem.id, docItem.data()));
        setComments(buildCommentThreads(next));
        setCommentsLoading(false);
      },
      (error) => {
        console.error(error);
        setComments([]);
        setCommentsLoading(false);
        setCommentsError("Nao foi possivel carregar os comentarios deste post.");
      }
    );

    return () => unsubscribe();
  }, [activeCommentsPostId]);

  const commentsTotal = useMemo(
    () => comments.reduce((acc, item) => acc + 1 + item.replies.length, 0),
    [comments]
  );

  const toggleCommentsForPost = useCallback((postId) => {
    setReplyParentId("");
    setReplyMessage("");
    setCommentsError("");
    setActiveCommentsPostId((current) => (current === postId ? "" : postId));
  }, []);

  const closeComments = useCallback(() => {
    setActiveCommentsPostId("");
    setReplyParentId("");
    setReplyMessage("");
    setCommentsError("");
    setComments([]);
  }, []);

  const startReply = useCallback((commentId) => {
    setReplyParentId((current) => (current === commentId ? "" : commentId));
    setReplyMessage("");
  }, []);

  const cancelReply = useCallback(() => {
    setReplyParentId("");
    setReplyMessage("");
  }, []);

  const submitReply = useCallback(async () => {
    if (!activeCommentsPostId || !replyParentId || submittingReply) return;

    const trimmedMessage = replyMessage.trim();
    if (!trimmedMessage) {
      alert("Digite a resposta antes de enviar.");
      return;
    }

    setSubmittingReply(true);

    try {
      await addDoc(collection(db, "posts", activeCommentsPostId, "comments"), {
        name: adminDisplayName.trim() || user?.displayName?.trim() || "Equipe Dra. Lueine Barradas",
        email: (user?.email || "admin@dralueinebarradas.com.br").toLowerCase(),
        message: trimmedMessage.slice(0, 2000),
        parentId: replyParentId,
        isAdminReply: true,
        createdAt: serverTimestamp()
      });

      setReplyParentId("");
      setReplyMessage("");
    } catch (error) {
      console.error(error);
      alert("Nao foi possivel enviar a resposta agora.");
    } finally {
      setSubmittingReply(false);
    }
  }, [activeCommentsPostId, adminDisplayName, replyMessage, replyParentId, submittingReply, user?.displayName, user?.email]);

  const deleteComment = useCallback(async (comment) => {
    if (!activeCommentsPostId || !comment?.id || deletingCommentId) return;

    const isReply = Boolean(comment.parentId);
    const confirmMessage = isReply
      ? "Tem certeza que deseja excluir esta resposta?"
      : "Tem certeza que deseja excluir este comentario e todas as respostas?";

    if (!window.confirm(confirmMessage)) return;

    setDeletingCommentId(comment.id);

    try {
      if (isReply) {
        await deleteDoc(doc(db, "posts", activeCommentsPostId, "comments", comment.id));
      } else {
        const repliesSnapshot = await getDocs(query(
          collection(db, "posts", activeCommentsPostId, "comments"),
          where("parentId", "==", comment.id)
        ));

        const refsToDelete = [
          doc(db, "posts", activeCommentsPostId, "comments", comment.id),
          ...repliesSnapshot.docs.map((docItem) => docItem.ref)
        ];

        await deleteRefsInChunks(refsToDelete);
      }
    } catch (error) {
      console.error(error);
      alert("Nao foi possivel excluir o comentario agora.");
    } finally {
      setDeletingCommentId("");
    }
  }, [activeCommentsPostId, deletingCommentId]);

  return {
    activeCommentsPostId,
    comments,
    commentsTotal,
    commentsLoading,
    commentsError,
    replyParentId,
    replyMessage,
    submittingReply,
    deletingCommentId,
    setReplyMessage,
    toggleCommentsForPost,
    closeComments,
    startReply,
    cancelReply,
    submitReply,
    deleteComment
  };
}
