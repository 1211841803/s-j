import type { MemoryDraft, MemoryKind } from "../types/memoir";

export function formatDateFromTimestamp(timestamp: number) {
  if (!timestamp) return new Date().toISOString().slice(0, 10);

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);

  return date.toISOString().slice(0, 10);
}

export function getYearFromDate(value: string) {
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) ? year : new Date().getFullYear();
}

export function titleFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "未命名";
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = url;
  });
}

async function compressImageFile(file: File) {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return {
      contentType: file.type || "application/octet-stream",
      dataUrl: await readFileAsDataUrl(file),
      fileName: file.name,
    };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return {
        contentType: file.type || "application/octet-stream",
        dataUrl: await readFileAsDataUrl(file),
        fileName: file.name,
      };
    }

    context.fillStyle = "#fbf7ef";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return {
      contentType: "image/jpeg",
      dataUrl: canvas.toDataURL("image/jpeg", 0.84),
      fileName: `${titleFromFileName(file.name)}.jpg`,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareFileForUpload(file: File) {
  if (file.type.startsWith("image/")) {
    return compressImageFile(file);
  }

  return {
    contentType: file.type || "application/octet-stream",
    dataUrl: await readFileAsDataUrl(file),
    fileName: file.name,
  };
}

export async function fileToMemoryDraft(
  file: File,
  mediaUrl?: string,
): Promise<MemoryDraft | null> {
  if (!/^(image|video)\//.test(file.type)) return null;

  const date = formatDateFromTimestamp(file.lastModified);
  const kind: MemoryKind = file.type.startsWith("video") ? "video" : "photo";
  const title = titleFromFileName(file.name);

  return {
    kind,
    title: "",
    date,
    place: "",
    mediaUrl: mediaUrl ?? (await readFileAsDataUrl(file)),
    posterUrl: kind === "video" ? "" : undefined,
    alt: title,
    caption: "",
    liked: false,
  };
}
