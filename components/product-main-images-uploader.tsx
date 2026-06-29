"use client";

import { GripVertical, ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const imageSlotCount = 6;

type ImageSlot = {
  existingUrl: string;
  file: File | null;
  id: string;
  previewUrl: string | null;
};

type ProductMainImagesUploaderProps = {
  initialImages?: string[];
};

function createEmptySlot(index: number): ImageSlot {
  return {
    existingUrl: "",
    file: null,
    id: `empty-${index}`,
    previewUrl: null
  };
}

function createInitialSlots(initialImages: string[] = []) {
  return Array.from({ length: imageSlotCount }, (_, index) => {
    const imageUrl = initialImages[index] ?? "";

    if (!imageUrl) {
      return createEmptySlot(index);
    }

    return {
      existingUrl: imageUrl,
      file: null,
      id: `existing-${index}-${imageUrl}`,
      previewUrl: imageUrl
    };
  });
}

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function syncInputFile(input: HTMLInputElement | null, file: File | null) {
  if (!input) {
    return;
  }

  if (!file) {
    input.value = "";
    return;
  }

  try {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
  } catch {
    input.value = "";
  }
}

function compactSlots(slots: ImageSlot[]) {
  const filledSlots = slots.filter((slot) => slot.previewUrl);
  return Array.from({ length: imageSlotCount }, (_, index) => (
    filledSlots[index] ?? createEmptySlot(index)
  ));
}

function moveSlot(slots: ImageSlot[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return slots;
  }

  const next = [...slots];
  const [movedSlot] = next.splice(fromIndex, 1);

  if (!movedSlot) {
    return slots;
  }

  next.splice(toIndex, 0, movedSlot);
  return next;
}

export function ProductMainImagesUploader({ initialImages = [] }: ProductMainImagesUploaderProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const draggedIndexRef = useRef<number | null>(null);
  const latestSlotsRef = useRef<ImageSlot[]>([]);
  const [slots, setSlots] = useState<ImageSlot[]>(() => createInitialSlots(initialImages));
  const initialImagesKey = initialImages.join("\u0000");
  const hasAnyImage = useMemo(() => slots.some((slot) => slot.previewUrl), [slots]);

  useEffect(() => {
    latestSlotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    setSlots((current) => {
      current.forEach((slot) => revokeBlobUrl(slot.previewUrl));
      return createInitialSlots(initialImages);
    });
  }, [initialImages, initialImagesKey]);

  useEffect(() => {
    slots.forEach((slot) => {
      syncInputFile(inputRefs.current[slot.id], slot.file);
    });
  }, [slots]);

  useEffect(() => (
    () => {
      latestSlotsRef.current.forEach((slot) => revokeBlobUrl(slot.previewUrl));
    }
  ), []);

  function addFiles(startIndex: number, fileList: FileList | null) {
    const selectedFiles = Array.from(fileList ?? []).slice(0, imageSlotCount);

    if (selectedFiles.length === 0) {
      return;
    }

    setSlots((current) => {
      const next = [...current];
      const targetIndexes = [
        startIndex,
        ...next
          .map((slot, index) => ({ index, isEmpty: !slot.previewUrl }))
          .filter((slot) => slot.isEmpty && slot.index > startIndex)
          .map((slot) => slot.index),
        ...next
          .map((slot, index) => ({ index, isEmpty: !slot.previewUrl }))
          .filter((slot) => slot.isEmpty && slot.index < startIndex)
          .map((slot) => slot.index)
      ].filter((index, position, indexes) => indexes.indexOf(index) === position);

      selectedFiles.slice(0, targetIndexes.length).forEach((file, fileIndex) => {
        const targetIndex = targetIndexes[fileIndex];

        if (targetIndex === undefined) {
          return;
        }

        revokeBlobUrl(next[targetIndex]?.previewUrl ?? null);
        next[targetIndex] = {
          existingUrl: "",
          file,
          id: `file-${Date.now()}-${targetIndex}-${fileIndex}-${file.name}`,
          previewUrl: URL.createObjectURL(file)
        };
      });

      return compactSlots(next);
    });
  }

  function clearImage(index: number) {
    setSlots((current) => {
      const next = [...current];
      revokeBlobUrl(next[index]?.previewUrl ?? null);
      next[index] = createEmptySlot(index);
      return compactSlots(next);
    });
  }

  function handleDrop(targetIndex: number) {
    const draggedIndex = draggedIndexRef.current;
    draggedIndexRef.current = null;

    if (draggedIndex === null || !slots[draggedIndex]?.previewUrl) {
      return;
    }

    setSlots((current) => compactSlots(moveSlot(current, draggedIndex, targetIndex)));
  }

  return (
    <div className="main-image-uploader">
      {slots.map((slot, index) => (
        <div
          className={`main-image-slot${slot.previewUrl ? " has-image" : ""}`}
          draggable={Boolean(slot.previewUrl)}
          key={slot.id}
          onDragEnd={() => {
            draggedIndexRef.current = null;
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragStart={(event) => {
            draggedIndexRef.current = index;
            event.dataTransfer.effectAllowed = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop(index);
          }}
        >
          <input name="existingMainImages" type="hidden" value={slot.existingUrl} />
          <input
            accept="image/*"
            className="visually-hidden"
            multiple
            name="mainImages"
            onChange={(event) => {
              addFiles(index, event.target.files);
              event.target.value = "";
            }}
            ref={(element) => {
              inputRefs.current[slot.id] = element;
            }}
            required={!hasAnyImage && index === 0}
            type="file"
          />
          <button
            className="main-image-picker"
            onClick={() => inputRefs.current[slot.id]?.click()}
            type="button"
          >
            {slot.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`产品主图 ${index + 1}`} src={slot.previewUrl} />
            ) : (
              <span>
                <ImagePlus size={18} />
                {index === 0 ? "主图" : `图片 ${index + 1}`}
              </span>
            )}
          </button>
          {slot.previewUrl ? (
            <>
              <span className="main-image-drag-handle" title="拖动排序">
                <GripVertical size={14} />
              </span>
              <button
                className="main-image-remove"
                onClick={() => clearImage(index)}
                title="移除图片"
                type="button"
              >
                <X size={14} />
              </button>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
