/** Decode locally and retain only a bounded PNG preview, never a remote URL. */
export async function imagePreview(file: File): Promise<string> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 12 * 1024 * 1024
  )
    throw new Error("invalid_image");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40000000
    )
      throw new Error("invalid_image");
    let edge = 512;
    while (edge >= 64) {
      const ratio = Math.min(
        1,
        edge / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("invalid_image");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/png");
      if (
        result.startsWith("data:image/png;base64,") &&
        result.length <= 109250
      )
        return result;
      edge = Math.floor(edge * 0.8);
    }
    throw new Error("invalid_image");
  } finally {
    URL.revokeObjectURL(url);
  }
}
