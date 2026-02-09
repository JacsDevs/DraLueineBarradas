import { useEffect, useRef, useState, Suspense, lazy } from "react";
import TextareaAutosize from "react-textarea-autosize";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

export default function PostForm({
  isEditing,
  title,
  summary,
  content,
  featuredImage,
  featuredFile,
  uploading,
  onTitleChange,
  onSummaryChange,
  onContentChange,
  onFeaturedSelect,
  onRemoveFeatured,
  onSavePost,
  onCancel,
  quillRef,
  quillModules,
  quillFormats
}) {
  const [isQuillStuck, setIsQuillStuck] = useState(false);
  const quillStickySentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = quillStickySentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsQuillStuck(!entry.isIntersecting);
      },
      { root: null, threshold: [1], rootMargin: "-8px 0px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="post-form">
      <h3>{isEditing ? "Editar Post" : "Novo Post"}</h3>
      <label>T�tulo do post:</label>
      <TextareaAutosize className="auto-textarea" value={title} placeholder="T�tulo" onChange={e => onTitleChange(e.target.value)} />
      <label>Resumo do post:</label>
      <TextareaAutosize className="auto-textarea" value={summary} placeholder="Resumo" onChange={e => onSummaryChange(e.target.value)} />

      <div className="form-section">
        <div className="featured-image-field">
          <label>Imagem de Destaque:</label>
          {!featuredImage && <input type="file" accept="image/*" onChange={onFeaturedSelect} />}
          {featuredImage && (
            <div className="featured-preview">
              <img src={featuredImage} alt="Imagem de destaque" />
              <button type="button" className="remove-featured" onClick={onRemoveFeatured} aria-label="Remover imagem de destaque">�</button>
            </div>
          )}
        </div>
      </div>

      <label>Texto do post:</label>
      <div ref={quillStickySentinelRef} className="quill-sticky-sentinel" aria-hidden="true" />
      <Suspense fallback={<div className="quill-loading">Carregando editor...</div>}>
        <ReactQuill
          className={`quill-editor${isQuillStuck ? " is-stuck" : ""}`}
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={onContentChange}
          modules={quillModules}
          formats={quillFormats}
        />
      </Suspense>

      {uploading && <p>Enviando mídia...</p>}

      <div className="admin-actions">
        <button
          className="admin-btn primary"
          onClick={onSavePost}
          disabled={uploading || (!isEditing && (!featuredFile || !title || !summary || !content))}
        >
          {isEditing ? "Salvar Alterações" : "Publicar"}
        </button>
        <button className="admin-btn cancel" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
