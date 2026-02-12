import { useMemo, useRef, useCallback, useState } from "react";
import { Quill } from "react-quill";

let quillFormatsRegistered = false;
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 25 * 1024 * 1024;
const DEFAULT_BUTTON_URL = "https://wa.me/5591985807373?text=Ol%C3%A1%20Dra.%20Lueine%2C%20gostaria%20de%20agendar%20uma%20consulta.";

function registerQuillFormats() {
  if (quillFormatsRegistered) return;

  const BlockEmbed = Quill.import("blots/block/embed");
  const Link = Quill.import("formats/link");
  const icons = Quill.import("ui/icons");

  class ButtonLink extends Link {
    static blotName = "button";
    static tagName = "A";
    static className = "ql-button-link";

    static create(value) {
      const node = super.create(value);
      node.setAttribute("role", "button");
      node.classList.add("ql-button-link");
      return node;
    }
  }

  class FigureImage extends BlockEmbed {
    static blotName = "figureImage";
    static tagName = "figure";
    static className = "quill-figure";

    static create(value) {
      const node = super.create();
      const img = document.createElement("img");
      img.setAttribute("src", value?.src || "");
      if (value?.alt) img.setAttribute("alt", value.alt);
      if (value?.title) img.setAttribute("title", value.title);
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      node.dataset.alt = value?.alt || "";
      node.dataset.caption = value?.caption || "";
      node.dataset.source = value?.source || "";
      node.appendChild(img);

      const hasCaption = Boolean(value?.caption || value?.source);
      if (hasCaption) {
        const caption = document.createElement("figcaption");
        if (value?.caption && value?.source) {
          caption.textContent = `Legenda: ${value.caption} - Fonte: ${value.source}`;
        } else if (value?.caption) {
          caption.textContent = `Legenda: ${value.caption}`;
        } else if (value?.source) {
          caption.textContent = `Fonte: ${value.source}`;
        }
        node.appendChild(caption);
      }

      return node;
    }

    static value(node) {
      return {
        src: node.querySelector("img")?.getAttribute("src") || "",
        alt: node.dataset.alt || "",
        caption: node.dataset.caption || "",
        source: node.dataset.source || ""
      };
    }
  }

  class Spacer extends BlockEmbed {
    static blotName = "spacer";
    static tagName = "div";
    static className = "quill-spacer";
  }

  icons.button =
    "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" aria-hidden=\"true\">" +
    "<path d=\"M6 6h9a4 4 0 010 8H8v4H6V6zm2 2v4h7a2 2 0 000-4H8z\" fill=\"currentColor\"/>" +
    "</svg>";

  icons.spacer =
    "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" aria-hidden=\"true\">" +
    "<path d=\"M4 7h16v2H4V7zm0 8h16v2H4v-2z\" fill=\"currentColor\"/>" +
    "</svg>";

  Quill.register(ButtonLink);
  Quill.register(FigureImage);
  Quill.register(Spacer);
  quillFormatsRegistered = true;
}

const initialModalState = {
  open: false,
  type: "",
  sourceType: "url",
  fields: {
    url: "",
    file: null,
    alt: "",
    caption: "",
    source: "",
    buttonText: "",
    buttonUrl: ""
  },
  errors: {}
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = (err) => reject(err);
  reader.readAsDataURL(file);
});

const getSafeInsertIndex = (quill) => {
  const range = quill.getSelection(true);
  if (range && typeof range.index === "number") return range.index;
  return Math.max(quill.getLength() - 1, 0);
};

const parseUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const normalizeExternalUrl = (rawUrl) => {
  const parsed = parseUrl(rawUrl.trim());
  if (!parsed) return "";
  if (!["http:", "https:"].includes(parsed.protocol)) return "";
  return parsed.toString();
};

const normalizeButtonUrl = (rawUrl) => {
  const value = rawUrl.trim();
  if (!value) return "";
  if (value.startsWith("/") || value.startsWith("#")) return value;

  const parsed = parseUrl(value);
  if (!parsed) return "";
  if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) return "";
  return parsed.toString();
};

const validateMediaFile = (file, type) => {
  if (!file) {
    return type === "image"
      ? "Selecione um arquivo de imagem."
      : "Selecione um arquivo de video.";
  }

  if (type === "image") {
    if (!file.type.startsWith("image/")) {
      return "Arquivo invalido. Use um formato de imagem.";
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      return "A imagem deve ter no maximo 5MB.";
    }
  }

  if (type === "video") {
    if (!file.type.startsWith("video/")) {
      return "Arquivo invalido. Use um formato de video.";
    }
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      return "O video deve ter no maximo 25MB.";
    }
  }

  return "";
};

const normalizeYoutubeUrl = (rawUrl) => {
  const normalizedUrl = normalizeExternalUrl(rawUrl);
  if (!normalizedUrl) return "";

  try {
    const url = new URL(normalizedUrl);
    const host = url.hostname.replace("www.", "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (normalizedUrl.includes("/embed/")) return normalizedUrl;
  } catch {
    return "";
  }
  return normalizedUrl;
};

export function useQuillUpload({ setUploading }) {
  const quillRef = useRef(null);
  const [mediaModal, setMediaModal] = useState(initialModalState);

  registerQuillFormats();

  const insertFigureImage = useCallback(({ src, alt, caption, source }) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const index = getSafeInsertIndex(quill);
    quill.insertEmbed(index, "figureImage", { src, alt, caption, source });
    quill.setSelection(index + 1);
  }, []);

  const openModal = useCallback((type) => {
    setMediaModal({
      open: true,
      type,
      sourceType: "url",
      fields: {
        url: "",
        file: null,
        alt: "",
        caption: "",
        source: "",
        buttonText: type === "button" ? "Agende sua consulta" : "",
        buttonUrl: type === "button" ? DEFAULT_BUTTON_URL : ""
      },
      errors: {}
    });
  }, []);

  const closeModal = useCallback(() => {
    setMediaModal(initialModalState);
  }, []);

  const updateField = useCallback((field, value) => {
    setMediaModal((prev) => ({
      ...prev,
      fields: { ...prev.fields, [field]: value },
      errors: { ...prev.errors, [field]: "" }
    }));
  }, []);

  const updateFile = useCallback((file) => {
    setMediaModal((prev) => ({
      ...prev,
      fields: { ...prev.fields, file },
      errors: { ...prev.errors, file: "" }
    }));
  }, []);

  const updateSourceType = useCallback((sourceType) => {
    setMediaModal((prev) => ({
      ...prev,
      sourceType,
      fields: { ...prev.fields, url: "", file: null },
      errors: {}
    }));
  }, []);

  const validateModal = useCallback(() => {
    const errors = {};
    const rawUrl = mediaModal.fields.url.trim();
    const buttonText = mediaModal.fields.buttonText.trim();
    const buttonUrl = mediaModal.fields.buttonUrl.trim();

    if (mediaModal.type === "image") {
      if (mediaModal.sourceType === "url") {
        if (!rawUrl) {
          errors.url = "Informe a URL da imagem.";
        } else if (!normalizeExternalUrl(rawUrl)) {
          errors.url = "Use uma URL valida iniciando com http:// ou https://.";
        }
      } else {
        const fileError = validateMediaFile(mediaModal.fields.file, "image");
        if (fileError) errors.file = fileError;
      }
    }

    if (mediaModal.type === "video") {
      if (mediaModal.sourceType === "url") {
        if (!rawUrl) {
          errors.url = "Informe a URL do video.";
        } else if (!normalizeYoutubeUrl(rawUrl)) {
          errors.url = "Use uma URL valida iniciando com http:// ou https://.";
        }
      } else {
        const fileError = validateMediaFile(mediaModal.fields.file, "video");
        if (fileError) errors.file = fileError;
      }
    }

    if (mediaModal.type === "button") {
      if (!buttonText) errors.buttonText = "Informe o texto do botao.";
      if (!buttonUrl) {
        errors.buttonUrl = "Informe o link do botao.";
      } else if (!normalizeButtonUrl(buttonUrl)) {
        errors.buttonUrl = "Use um link valido (https://, mailto:, tel:, / ou #).";
      }
    }

    setMediaModal((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [mediaModal]);

  const submitModal = useCallback(async () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    if (!validateModal()) return;

    setUploading(true);

    try {
      if (mediaModal.type === "image") {
        const alt = mediaModal.fields.alt.trim();
        const caption = mediaModal.fields.caption.trim();
        const source = mediaModal.fields.source.trim();

        if (mediaModal.sourceType === "url") {
          const src = normalizeExternalUrl(mediaModal.fields.url);
          if (!src) throw new Error("invalid-image-url");
          insertFigureImage({ src, alt, caption, source });
        } else {
          const dataUrl = await readFileAsDataUrl(mediaModal.fields.file);
          insertFigureImage({ src: dataUrl, alt, caption, source });
        }
      }

      if (mediaModal.type === "video") {
        const index = getSafeInsertIndex(quill);

        if (mediaModal.sourceType === "url") {
          const videoUrl = normalizeYoutubeUrl(mediaModal.fields.url);
          if (!videoUrl) throw new Error("invalid-video-url");
          quill.insertEmbed(index, "video", videoUrl);
        } else {
          const dataUrl = await readFileAsDataUrl(mediaModal.fields.file);
          quill.insertEmbed(index, "video", dataUrl);
        }
        quill.setSelection(index + 1);
      }

      if (mediaModal.type === "button") {
        const buttonText = mediaModal.fields.buttonText.trim();
        const buttonUrl = normalizeButtonUrl(mediaModal.fields.buttonUrl);
        if (!buttonText || !buttonUrl) throw new Error("invalid-button");

        const index = getSafeInsertIndex(quill);
        quill.insertText(index, buttonText, "button", buttonUrl);
        quill.setSelection(index + buttonText.length);
      }

      closeModal();
    } catch (err) {
      console.error(err);
      let formError = "Nao foi possivel inserir a midia. Tente novamente.";
      if (err?.message === "invalid-image-url") {
        formError = "URL da imagem invalida.";
      }
      if (err?.message === "invalid-video-url") {
        formError = "URL do video invalida.";
      }
      if (err?.message === "invalid-button") {
        formError = "Dados do botao invalidos.";
      }

      setMediaModal((prev) => ({
        ...prev,
        errors: { ...prev.errors, form: formError }
      }));
    } finally {
      setUploading(false);
    }
  }, [closeModal, insertFigureImage, mediaModal, setUploading, validateModal]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ script: "sub" }, { script: "super" }],
        ["blockquote"],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "button", "image", "video", "spacer"],
        ["clean"]
      ],
      handlers: {
        image: () => openModal("image"),
        video: () => openModal("video"),
        button: () => openModal("button"),
        spacer: () => {
          const quill = quillRef.current?.getEditor();
          if (!quill) return;

          const index = getSafeInsertIndex(quill);
          quill.insertEmbed(index, "spacer", true);
          quill.setSelection(index + 1);
        }
      }
    }
  }), [openModal]);

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "script",
    "blockquote",
    "align",
    "link",
    "button",
    "image",
    "figureImage",
    "video",
    "spacer"
  ];

  return {
    quillRef,
    quillModules,
    quillFormats,
    mediaModal,
    closeModal,
    submitModal,
    updateField,
    updateFile,
    updateSourceType
  };
}
