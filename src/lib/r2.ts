import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type R2FolderKind = "invoices" | "documents";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  return r2Client;
}

/** Sanitize clients.company for use as an R2 path segment (not a real mkdir). */
export function clientStorageFolder(company: string): string {
  const cleaned = company
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return cleaned || "unknown-client";
}

/** Keep the original upload filename; only strip path separators. */
export function safeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop()?.trim() || "file";
  return base.replace(/^\.+/, "") || "file";
}

/**
 * Object key layout:
 *   {company}/invoices/{original-filename}
 *   {company}/documents/{original-filename}
 */
export function buildObjectKey(
  company: string,
  kind: R2FolderKind,
  fileName: string
): string {
  const folder = clientStorageFolder(company);
  const name = safeFileName(fileName);
  return `${folder}/${kind}/${name}`;
}

export function publicObjectUrl(key: string): string {
  const base = requiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/${encodedKey}`;
}

/** Recover R2 object key from a public file URL (strips query string). */
export function r2KeyFromPublicUrl(
  fileUrl: string | null | undefined
): string | null {
  if (!fileUrl?.trim()) return null;
  try {
    const base = requiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
    const raw = fileUrl.trim().split("?")[0];
    const url = new URL(raw);
    const baseUrl = new URL(base);
    if (url.origin !== baseUrl.origin) return null;

    let path = url.pathname;
    const basePath = baseUrl.pathname.replace(/\/$/, "");
    if (basePath && path.startsWith(basePath)) {
      path = path.slice(basePath.length);
    }
    path = path.replace(/^\//, "");
    if (!path) return null;

    return path
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export async function uploadToR2(options: {
  company: string;
  kind: R2FolderKind;
  fileName: string;
  body: Buffer;
  contentType?: string;
}): Promise<{ key: string; url: string }> {
  const key = buildObjectKey(options.company, options.kind, options.fileName);
  const bucket = requiredEnv("R2_BUCKET_NAME");

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: options.body,
      ContentType: options.contentType || "application/octet-stream",
    })
  );

  return { key, url: publicObjectUrl(key) };
}

export async function deleteFromR2ByKey(key: string): Promise<void> {
  const bucket = requiredEnv("R2_BUCKET_NAME");
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Delete an R2 object by its public URL.
 * Returns false if the URL could not be mapped to a key.
 */
export async function deleteFromR2ByPublicUrl(
  fileUrl: string | null | undefined
): Promise<boolean> {
  const key = r2KeyFromPublicUrl(fileUrl);
  if (!key) return false;
  try {
    await deleteFromR2ByKey(key);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/NoSuchKey|Not Found|404/i.test(message)) return true;
    throw err;
  }
}

/** Delete previous object when replacing with a different key (same key = overwrite). */
export async function deleteReplacedR2Object(
  previousFileUrl: string | null | undefined,
  nextKey: string
): Promise<void> {
  const prevKey = r2KeyFromPublicUrl(previousFileUrl);
  if (!prevKey || prevKey === nextKey) return;
  try {
    await deleteFromR2ByKey(prevKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/NoSuchKey|Not Found|404/i.test(message)) return;
    throw err;
  }
}
