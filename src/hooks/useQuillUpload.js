import { useMemo, useRef, useCallback } from "react";

export function useQuillUpload({ setUploading }) {
  const quillRef = useRef(null);

  const uploadFile = useCallback((type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      setUploading(true);

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          if (type === "image") quill.insertEmbed(range.index, "image", dataUrl);
          else quill.insertEmbed(range.index, "video", dataUrl);
          quill.setSelection(range.index + 1);
        } catch (err) {
          console.error(err);
          alert("Erro ao inserir mÃ­dia: " + err.message);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = (err) => {
        console.error(err);
        alert("Erro ao ler arquivo: " + err.message);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    };
  }, [setUploading]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [2, 3, false] }],
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
  }), [uploadFile]);

  const quillFormats = ["header","bold","italic","underline","strike","list","bullet","script","blockquote","align","link","image","video"];

  return { quillRef, quillModules, quillFormats };
}
