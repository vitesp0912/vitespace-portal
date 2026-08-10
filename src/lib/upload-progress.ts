/** Upload FormData with progress via XHR (fetch has no upload progress). */
export function uploadFormDataWithProgress(
  url: string,
  body: FormData,
  onProgress: (percent: number) => void
): Promise<{ ok: true; data: unknown } | { ok: false; error: string; status: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      const data = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve({ ok: true, data });
        return;
      }
      const error =
        (typeof data === "object" && data && "error" in data
          ? String((data as { error?: string }).error)
          : null) || `Upload failed (${xhr.status})`;
      resolve({ ok: false, error, status: xhr.status });
    };

    xhr.onerror = () => {
      resolve({ ok: false, error: "Network error during upload.", status: 0 });
    };

    xhr.send(body);
  });
}
