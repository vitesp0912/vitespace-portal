/** Detect media kind from mime type and/or filename. */
export function getDocumentMediaKind(
  mimeType?: string | null,
  fileName?: string | null
): "image" | "video" | "other" {
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";

  const name = (fileName || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "avif"].includes(ext)) {
    return "image";
  }
  if (["mp4", "webm", "mov", "m4v", "avi", "mkv"].includes(ext)) {
    return "video";
  }
  return "other";
}

export function isOfficeOrPdf(mimeType?: string | null, fileName?: string | null): boolean {
  const mime = (mimeType || "").toLowerCase();
  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("officedocument") ||
    mime === "application/msword"
  ) {
    return true;
  }
  const name = (fileName || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  return ["pdf", "doc", "docx"].includes(ext);
}
