/**
 * Default avatars + validation helpers for profile images.
 */

export const DEFAULT_AVATARS = [
  { id: "default-w", src: "/avatars/default-w.svg", labelKey: "defaultW" },
  { id: "default-smile", src: "/avatars/default-smile.svg", labelKey: "defaultSmile" },
  { id: "default-grad", src: "/avatars/default-grad.svg", labelKey: "defaultGrad" },
  { id: "default-star", src: "/avatars/default-star.svg", labelKey: "defaultStar" },
  { id: "default-book", src: "/avatars/default-book.svg", labelKey: "defaultBook" },
  { id: "default-rocket", src: "/avatars/default-rocket.svg", labelKey: "defaultRocket" },
  { id: "default-bulb", src: "/avatars/default-bulb.svg", labelKey: "defaultBulb" },
  { id: "default-trophy", src: "/avatars/default-trophy.svg", labelKey: "defaultTrophy" },
  { id: "default-pencil", src: "/avatars/default-pencil.svg", labelKey: "defaultPencil" },
  { id: "default-owl", src: "/avatars/default-owl.svg", labelKey: "defaultOwl" },
] as const;

const DEFAULT_SRC_SET = new Set(DEFAULT_AVATARS.map((a) => a.src));

/** Max data-URL length stored in DB (~400KB). */
export const MAX_AVATAR_DATA_URL_CHARS = 420_000;

/** Cropped JPEG output size (px). */
export const AVATAR_OUTPUT_SIZE = 256;

/** Suggest crop UI when either dimension exceeds this. */
export const AVATAR_CROP_THRESHOLD_PX = 512;

export function isDefaultAvatarUrl(url: string): boolean {
  return DEFAULT_SRC_SET.has(url as (typeof DEFAULT_AVATARS)[number]["src"]);
}

export function isAllowedAvatarUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (isDefaultAvatarUrl(trimmed)) return true;
  if (/^\/uploads\/avatars\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(trimmed)) {
    return true;
  }
  if (trimmed.startsWith("data:image/")) {
    return (
      /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(trimmed) &&
      trimmed.length <= MAX_AVATAR_DATA_URL_CHARS
    );
  }
  return false;
}

/**
 * Client-side: load file as Image, return natural size.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_LOAD_FAILED"));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    img.src = src;
  });
}

/**
 * Circular crop via canvas. `zoom` is relative scale (>=1),
 * center of crop is image center.
 */
export function cropImageToCircleDataUrl(
  img: HTMLImageElement,
  zoom: number,
  size = AVATAR_OUTPUT_SIZE,
  quality = 0.88,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");

  const z = Math.max(1, zoom);
  const srcSide = Math.min(img.naturalWidth, img.naturalHeight) / z;
  const sx = (img.naturalWidth - srcSide) / 2;
  const sy = (img.naturalHeight - srcSide) / 2;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, sx, sy, srcSide, srcSide, 0, 0, size, size);

  return canvas.toDataURL("image/jpeg", quality);
}

/** Square JPEG data URL without circle clip (file upload path uses CSS circle). */
export function cropImageToSquareDataUrl(
  img: HTMLImageElement,
  zoom: number,
  size = AVATAR_OUTPUT_SIZE,
  quality = 0.88,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");

  const z = Math.max(1, zoom);
  const srcSide = Math.min(img.naturalWidth, img.naturalHeight) / z;
  const sx = (img.naturalWidth - srcSide) / 2;
  const sy = (img.naturalHeight - srcSide) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, srcSide, srcSide, 0, 0, size, size);

  return canvas.toDataURL("image/jpeg", quality);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header?.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binary = atob(b64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
