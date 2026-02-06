async function uploadFileOptimized(file, path, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    maxSizeMB = 2,
    isImage = true
  } = options;

  if (!file) throw new Error("Nenhum arquivo selecionado");

  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Arquivo maior que ${maxSizeMB}MB`);
  }

  let uploadFile = file;

  if (isImage) {
    uploadFile = await convertImageToWebP(file, maxWidth, maxHeight);
  }

  const fileRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, uploadFile);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// Função de conversão já existente
function convertImageToWebP(file, width, height) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");

      // Mantém proporção
      const ratio = Math.min(width / img.width, height / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.split(".")[0] + ".webp", { type: "image/webp" })),
        "image/webp",
        0.8
      );
    };
  });
}
