import { useEffect, useRef, useState, Suspense, lazy } from "react";
import TextareaAutosize from "react-textarea-autosize";
import "react-quill/dist/quill.snow.css";
import { FaPaperPlane, FaRegSave, FaTimes } from "react-icons/fa";

const ReactQuill = lazy(() => import("react-quill"));

export default function PostForm({
  isEditing,
  editingStatus,
  hideHeading = false,
  title,
  summary,
  content,
  featuredImage,
  featuredLinkDraft,
  canPublish,
  canSaveDraft,
  uploading,
  onTitleChange,
  onSummaryChange,
  onContentChange,
  onFeaturedSelect,
  onFeaturedLinkChange,
  onFeaturedLinkApply,
  onRemoveFeatured,
  onSavePost,
  onSaveDraft,
  onCancel,
  quillRef,
  quillModules,
  quillFormats,
  onAttachQuillTooltips,
  mediaModal,
  onMediaClose,
  onMediaSubmit,
  onMediaFieldChange,
  onMediaFileChange,
  onMediaSourceTypeChange
}) {
  const [isQuillStuck, setIsQuillStuck] = useState(false);
  const quillStickySentinelRef = useRef(null);

  const handleModalBackdropMouseDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (uploading) return;
    onMediaClose();
  };

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

  useEffect(() => {
    if (!mediaModal?.open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!uploading) onMediaClose();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!uploading) onMediaSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaModal?.open, onMediaClose, onMediaSubmit, uploading]);

  useEffect(() => {
    if (!onAttachQuillTooltips) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      const applied = onAttachQuillTooltips();
      attempts += 1;

      if (applied || attempts >= 25) {
        window.clearInterval(timer);
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [onAttachQuillTooltips]);

  return (
    <div className={`post-form${hideHeading ? " no-heading" : ""}`}>
      {!hideHeading && (
        <div className="post-form-header">
          <h3>{isEditing ? (editingStatus === "draft" ? "Editar rascunho" : "Editar post") : "Novo post"}</h3>
          <p>Estruture o conteudo com clareza para manter o blog organizado e consistente.</p>
        </div>
      )}

      <div className="post-form-block">
        <label className="form-label" htmlFor="post-title">Titulo do post</label>
        <TextareaAutosize
          id="post-title"
          className="auto-textarea"
          value={title}
          placeholder="Titulo"
          onChange={(e) => onTitleChange(e.target.value)}
        />

        <label className="form-label" htmlFor="post-summary">Resumo do post</label>
        <TextareaAutosize
          id="post-summary"
          className="auto-textarea"
          value={summary}
          placeholder="Resumo"
          onChange={(e) => onSummaryChange(e.target.value)}
        />
      </div>

      <div className="post-form-block featured-image-field">
        <div className="post-block-header">
          <label className="form-label">Imagem de destaque</label>
          <span className="form-helper">Use arquivo otimizado ou URL valida para manter boa performance.</span>
        </div>

        {!featuredImage && (
          <div className="featured-image-inputs">
            <label className="featured-input-group">
              Arquivo de imagem
              <input type="file" accept="image/*" onChange={onFeaturedSelect} />
            </label>

            <span className="featured-input-divider">ou</span>

            <label className="featured-input-group">
              Link da imagem
              <div className="featured-link-actions">
                <input
                  type="url"
                  value={featuredLinkDraft}
                  onChange={(e) => onFeaturedLinkChange(e.target.value)}
                  placeholder="https://"
                />
                <button
                  type="button"
                  className="admin-btn primary featured-link-btn"
                  onClick={onFeaturedLinkApply}
                  disabled={uploading || !featuredLinkDraft?.trim()}
                >
                  Usar link
                </button>
              </div>
            </label>
          </div>
        )}

        {featuredImage && (
          <div className="featured-preview">
            <img src={featuredImage} alt="Imagem de destaque" />
            <button
              type="button"
              className="remove-featured"
              onClick={onRemoveFeatured}
              aria-label="Remover imagem de destaque"
            >
              x
            </button>
          </div>
        )}
      </div>

      <div className="post-form-block">
        <div className="post-block-header">
          <label className="form-label" htmlFor="post-content">Conteúdo do post</label>
          <span className="form-helper">Use o editor para formatacao, midias e botoes de CTA.</span>
        </div>

        <div ref={quillStickySentinelRef} className="quill-sticky-sentinel" aria-hidden="true" />
        <Suspense fallback={<div className="quill-loading">Carregando editor...</div>}>
          <ReactQuill
            id="post-content"
            className={`quill-editor${isQuillStuck ? " is-stuck" : ""}`}
            ref={quillRef}
            theme="snow"
            placeholder="Insira o texto aqui"
            value={content}
            onChange={onContentChange}
            modules={quillModules}
            formats={quillFormats}
          />
        </Suspense>

        {uploading && <p className="uploading-hint">Enviando midia...</p>}
      </div>

      {mediaModal?.open && (
        <div
          className="quill-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={handleModalBackdropMouseDown}
        >
          <div className="quill-modal" aria-busy={uploading}>
            <h4>
              {mediaModal.type === "image" && "Inserir imagem"}
              {mediaModal.type === "video" && "Inserir video"}
              {mediaModal.type === "button" && "Inserir botao"}
            </h4>
            <p className="quill-modal-helper">Esc fecha a janela e Ctrl/Command + Enter confirma.</p>

            {mediaModal.type !== "button" && (
              <div className="quill-modal-tabs">
                <button
                  type="button"
                  className={`quill-tab${mediaModal.sourceType === "url" ? " is-active" : ""}`}
                  onClick={() => onMediaSourceTypeChange("url")}
                  disabled={uploading}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`quill-tab${mediaModal.sourceType === "file" ? " is-active" : ""}`}
                  onClick={() => onMediaSourceTypeChange("file")}
                  disabled={uploading}
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
                      disabled={uploading}
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
                      disabled={uploading}
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
                    disabled={uploading}
                  />
                </label>

                <label className="quill-modal-field">
                  Legenda
                  <input
                    type="text"
                    value={mediaModal.fields.caption}
                    onChange={(e) => onMediaFieldChange("caption", e.target.value)}
                    placeholder="Legenda exibida abaixo da imagem"
                    disabled={uploading}
                  />
                </label>

                <label className="quill-modal-field">
                  Fonte
                  <input
                    type="text"
                    value={mediaModal.fields.source}
                    onChange={(e) => onMediaFieldChange("source", e.target.value)}
                    placeholder="Ex: Foto de Fulano"
                    disabled={uploading}
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
                      disabled={uploading}
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
                      disabled={uploading}
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
                    disabled={uploading}
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
                    disabled={uploading}
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
              <button
                type="button"
                className="admin-btn cancel"
                onClick={onMediaClose}
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn primary"
                onClick={onMediaSubmit}
                disabled={uploading}
              >
                {uploading ? "Inserindo..." : "Inserir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-actions">
        <button
          type="button"
          className="admin-btn primary"
          onClick={onSavePost}
          disabled={uploading || !canPublish}
        >
          <FaPaperPlane aria-hidden="true" />
          {isEditing ? "Salvar e publicar" : "Publicar"}
        </button>
        <button
          type="button"
          className="admin-btn draft"
          onClick={onSaveDraft}
          disabled={uploading || !canSaveDraft}
        >
          <FaRegSave aria-hidden="true" />
          {isEditing && editingStatus === "draft" ? "Salvar rascunho" : "Salvar como rascunho"}
        </button>
        <button type="button" className="admin-btn cancel" onClick={onCancel}>
          <FaTimes aria-hidden="true" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
