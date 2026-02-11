import { useMemo, useRef, useCallback, useState } from "react";
import { Quill } from "react-quill";

let quillFormatsRegistered = false;

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

const normalizeYoutubeUrl = (rawUrl) => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace("www.", "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (rawUrl.includes("/embed/")) return rawUrl;
  } catch (err) {
    return rawUrl;
  }
  return rawUrl;
};

export function useQuillUpload({ setUploading }) {
  const quillRef = useRef(null);
  const [mediaModal, setMediaModal] = useState(initialModalState);

  registerQuillFormats();

  const insertFigureImage = useCallback(({ src, alt, caption, source }) => {
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, "figureImage", { src, alt, caption, source });
    quill.setSelection(range.index + 1);
  }, []);

  const openModal = useCallback((type) => {
    setMediaModal({
      open: true,
      type,
      sourceType: type === "button" ? "url" : "url",
      fields: {
        url: "",
        file: null,
        alt: "",
        caption: "",
        source: "",
        buttonText: type === "button" ? "Agende sua consulta" : "",
        buttonUrl: "https://wa.me/5591985807373?text=Ol%C3%A1%20Dra.%20Lueine%2C%20gostaria%20de%20agendar%20uma%20consulta."
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
    if (mediaModal.type === "image") {
      if (mediaModal.sourceType === "url") {
        if (!mediaModal.fields.url) errors.url = "Informe a URL da imagem.";
      } else if (!mediaModal.fields.file) {
        errors.file = "Selecione um arquivo de imagem.";
      }
    }
    if (mediaModal.type === "video") {
      if (mediaModal.sourceType === "url") {
        if (!mediaModal.fields.url) errors.url = "Informe a URL do video.";
      } else if (!mediaModal.fields.file) {
        errors.file = "Selecione um arquivo de video.";
      }
    }
    if (mediaModal.type === "button") {
      if (!mediaModal.fields.buttonText) errors.buttonText = "Informe o texto do botao.";
      if (!mediaModal.fields.buttonUrl) errors.buttonUrl = "Informe o link do botao.";
    }

    setMediaModal((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [mediaModal]);

  const submitModal = useCallback(async () => {
    if (!validateModal()) return;
    setUploading(true);

    try {
      if (mediaModal.type === "image") {
        const { alt, caption, source } = mediaModal.fields;
        if (mediaModal.sourceType === "url") {
          insertFigureImage({ src: mediaModal.fields.url, alt, caption, source });
        } else {
          const dataUrl = await readFileAsDataUrl(mediaModal.fields.file);
          insertFigureImage({ src: dataUrl, alt, caption, source });
        }
      }

      if (mediaModal.type === "video") {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        if (mediaModal.sourceType === "url") {
          const videoUrl = normalizeYoutubeUrl(mediaModal.fields.url);
          quill.insertEmbed(range.index, "video", videoUrl);
        } else {
          const dataUrl = await readFileAsDataUrl(mediaModal.fields.file);
          quill.insertEmbed(range.index, "video", dataUrl);
        }
        quill.setSelection(range.index + 1);
      }

      if (mediaModal.type === "button") {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertText(range.index, mediaModal.fields.buttonText, "button", mediaModal.fields.buttonUrl);
        quill.setSelection(range.index + mediaModal.fields.buttonText.length);
      }

      closeModal();
    } catch (err) {
      console.error(err);
      setMediaModal((prev) => ({
        ...prev,
        errors: { form: "Nao foi possivel inserir a midia. Tente novamente." }
      }));
    } finally {
      setUploading(false);
    }
  }, [closeModal, insertFigureImage, mediaModal, setUploading, validateModal]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [2, 3, false] }],
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
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "spacer", true);
          quill.setSelection(range.index + 1);
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
