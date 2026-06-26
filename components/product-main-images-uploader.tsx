"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

const imageSlotCount = 6;

export function ProductMainImagesUploader() {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [previews, setPreviews] = useState<Array<string | null>>(
    Array.from({ length: imageSlotCount }, () => null)
  );

  function updatePreview(index: number, file?: File) {
    setPreviews((current) => {
      const next = [...current];
      if (next[index]) {
        URL.revokeObjectURL(next[index]);
      }
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });
  }

  function clearImage(index: number) {
    const input = inputRefs.current[index];

    if (input) {
      input.value = "";
    }

    updatePreview(index);
  }

  return (
    <div className="main-image-uploader">
      {Array.from({ length: imageSlotCount }, (_, index) => (
        <div className="main-image-slot" key={index}>
          <input
            accept="image/*"
            className="visually-hidden"
            name="mainImages"
            onChange={(event) => updatePreview(index, event.target.files?.[0])}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            required={index === 0}
            type="file"
          />
          <button
            className="main-image-picker"
            onClick={() => inputRefs.current[index]?.click()}
            type="button"
          >
            {previews[index] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`产品主图 ${index + 1}`} src={previews[index] ?? ""} />
            ) : (
              <span>
                <ImagePlus size={18} />
                {index === 0 ? "主图" : `图片 ${index + 1}`}
              </span>
            )}
          </button>
          {previews[index] ? (
            <button
              className="main-image-remove"
              onClick={() => clearImage(index)}
              title="移除图片"
              type="button"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
