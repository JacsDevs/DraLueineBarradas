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
  quillFormats,
  mediaModal,
  onMediaClose,
  onMediaSubmit,
  onMediaFieldChange,
  onMediaFileChange,
  onMediaSourceTypeChange
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
      <label>Titulo do post:</label>
      <TextareaAutosize className="auto-textarea" value={title} placeholder="Titulo" onChange={e => onTitleChange(e.target.value)} />
      <label>Resumo do post:</label>
      <TextareaAutosize className="auto-textarea" value={summary} placeholder="Resumo" onChange={e => onSummaryChange(e.target.value)} />

      <div className="form-section">
        <div className="featured-image-field">
          <label>Imagem de Destaque:</label>
          {!featuredImage && <input type="file" accept="image/*" onChange={onFeaturedSelect} />}
          {featuredImage && (
            <div className="featured-preview">
              <img src={featuredImage} alt="Imagem de destaque" />
              <button type="button" className="remove-featured" onClick={onRemoveFeatured} aria-label="Remover imagem de destaque">X</button>
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

      {uploading && <p>Enviando midia...</p>}

      {mediaModal?.open && (
        <div className="quill-modal-backdrop" role="dialog" aria-modal="true">
          <div className="quill-modal">
            <h4>
              {mediaModal.type === "image" && "Inserir imagem"}
              {mediaModal.type === "video" && "Inserir video"}
              {mediaModal.type === "button" && "Inserir botao"}
            </h4>

            {mediaModal.type !== "button" && (
              <div className="quill-modal-tabs">
                <button
                  type="button"
                  className={`quill-tab${mediaModal.sourceType === "url" ? " is-active" : ""}`}
                  onClick={() => onMediaSourceTypeChange("url")}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`quill-tab${mediaModal.sourceType === "file" ? " is-active" : ""}`}
                  onClick={() => onMediaSourceTypeChange("file")}
                >
                  Arquivo
                </button>
              </div>
            )}

            {mediaModal.type === "image" && (
              <>
                {mediaModal.sourceType === "url" && (
                  <label className="quill-modal-field">
                    URL da imagem
                    <input
                      type="url"
                      value={mediaModal.fields.url}
                      onChange={(e) => onMediaFieldChange("url", e.target.value)}
                      placeholder="https://"
                    />
                    {mediaModal.errors.url && <span className="quill-modal-error">{mediaModal.errors.url}</span>}
                  </label>
                )}
                {mediaModal.sourceType === "file" && (
                  <label className="quill-modal-field">
                    Arquivo de imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onMediaFileChange(e.target.files?.[0] || null)}
                    />
                    {mediaModal.errors.file && <span className="quill-modal-error">{mediaModal.errors.file}</span>}
                  </label>
                )}
                <label className="quill-modal-field">
                  Texto alternativo (alt)
                  <input
                    type="text"
                    value={mediaModal.fields.alt}
                    onChange={(e) => onMediaFieldChange("alt", e.target.value)}
                    placeholder="Descricao acessivel da imagem"
                  />
                </label>
                <label className="quill-modal-field">
                  Legenda
                  <input
                    type="text"
                    value={mediaModal.fields.caption}
                    onChange={(e) => onMediaFieldChange("caption", e.target.value)}
                    placeholder="Legenda exibida abaixo da imagem"
                  />
                </label>
                <label className="quill-modal-field">
                  Fonte
                  <input
                    type="text"
                    value={mediaModal.fields.source}
                    onChange={(e) => onMediaFieldChange("source", e.target.value)}
                    placeholder="Ex: Foto de Fulano"
                  />
                </label>
              </>
            )}

            {mediaModal.type === "video" && (
              <>
                {mediaModal.sourceType === "url" && (
                  <label className="quill-modal-field">
                    URL do video (YouTube ou arquivo)
                    <input
                      type="url"
                      value={mediaModal.fields.url}
                      onChange={(e) => onMediaFieldChange("url", e.target.value)}
                      placeholder="https://"
                    />
                    {mediaModal.errors.url && <span className="quill-modal-error">{mediaModal.errors.url}</span>}
                  </label>
                )}
                {mediaModal.sourceType === "file" && (
                  <label className="quill-modal-field">
                    Arquivo de video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => onMediaFileChange(e.target.files?.[0] || null)}
                    />
                    {mediaModal.errors.file && <span className="quill-modal-error">{mediaModal.errors.file}</span>}
                  </label>
                )}
              </>
            )}

            {mediaModal.type === "button" && (
              <>
                <label className="quill-modal-field">
                  Texto do botao
                  <input
                    type="text"
                    value={mediaModal.fields.buttonText}
                    onChange={(e) => onMediaFieldChange("buttonText", e.target.value)}
                  />
                  {mediaModal.errors.buttonText && (
                    <span className="quill-modal-error">{mediaModal.errors.buttonText}</span>
                  )}
                </label>
                <label className="quill-modal-field">
                  Link do botao
                  <input
                    type="url"
                    value={mediaModal.fields.buttonUrl}
                    onChange={(e) => onMediaFieldChange("buttonUrl", e.target.value)}
                    placeholder="https://"
                  />
                  {mediaModal.errors.buttonUrl && (
                    <span className="quill-modal-error">{mediaModal.errors.buttonUrl}</span>
                  )}
                </label>
              </>
            )}

            {mediaModal.errors.form && (
              <div className="quill-modal-error form-error">{mediaModal.errors.form}</div>
            )}

            <div className="quill-modal-actions">
              <button type="button" className="admin-btn cancel" onClick={onMediaClose}>
                Cancelar
              </button>
              <button type="button" className="admin-btn primary" onClick={onMediaSubmit}>
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-actions">
        <button
          className="admin-btn primary"
          onClick={onSavePost}
          disabled={uploading || (!isEditing && (!featuredFile || !title || !summary || !content))}
        >
          {isEditing ? "Salvar Alteracoes" : "Publicar"}
        </button>
        <button className="admin-btn cancel" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
