"use client";

import { Film, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ProductVideoUploaderProps = {
  initialVideoUrl?: string | null;
};

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function ProductVideoUploader({ initialVideoUrl }: ProductVideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const latestPreviewRef = useRef<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState(initialVideoUrl || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialVideoUrl || null);

  useEffect(() => {
    revokeBlobUrl(latestPreviewRef.current);
    latestPreviewRef.current = initialVideoUrl || null;
    setExistingVideoUrl(initialVideoUrl || "");
    setPreviewUrl(initialVideoUrl || null);
  }, [initialVideoUrl]);

  useEffect(() => {
    latestPreviewRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => (
    () => {
      revokeBlobUrl(latestPreviewRef.current);
    }
  ), []);

  function updatePreview(file?: File) {
    if (!file) {
      return;
    }

    revokeBlobUrl(previewUrl);
    setExistingVideoUrl("");
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearVideo() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    revokeBlobUrl(previewUrl);
    setExistingVideoUrl("");
    setPreviewUrl(null);
  }

  return (
    <div className="product-video-uploader">
      <input name="existingProductVideo" type="hidden" value={existingVideoUrl} />
      <input
        accept="video/*"
        className="visually-hidden"
        name="productVideo"
        onChange={(event) => updatePreview(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <button
        className="product-video-picker"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {previewUrl ? (
          <video muted playsInline preload="metadata" src={previewUrl} />
        ) : (
          <span>
            <Film size={18} />
            视频
          </span>
        )}
      </button>
      {previewUrl ? (
        <button
          className="product-video-remove"
          onClick={clearVideo}
          title="移除视频"
          type="button"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
