"use client";

import { ImagePlus, List, Pilcrow, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ProductRichTextEditorProps = {
  initialHtml?: string | null;
};

export function ProductRichTextEditor({ initialHtml = "" }: ProductRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(initialHtml ?? "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialHtml) {
      editorRef.current.innerHTML = initialHtml;
      setHtml(initialHtml);
    }
  }, [initialHtml]);

  function syncHtml() {
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncHtml();
  }

  async function insertImage(file: File) {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch("/admin/products/uploads", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { url?: string };

      if (!payload.url) {
        return;
      }

      runCommand(
        "insertHTML",
        `<figure><img src="${payload.url}" alt="" /><figcaption></figcaption></figure>`
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="rich-editor">
      <input name="detailHtml" type="hidden" value={html} />
      <div className="rich-editor-toolbar" aria-label="详情编辑器工具栏">
        <button onClick={() => runCommand("formatBlock", "h2")} title="标题" type="button">
          <Type size={16} />
        </button>
        <button onClick={() => runCommand("formatBlock", "p")} title="正文" type="button">
          <Pilcrow size={16} />
        </button>
        <button onClick={() => runCommand("bold")} title="加粗" type="button">
          <strong>B</strong>
        </button>
        <button onClick={() => runCommand("insertUnorderedList")} title="列表" type="button">
          <List size={16} />
        </button>
        <button
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          title="插入图片"
          type="button"
        >
          <ImagePlus size={16} />
        </button>
      </div>
      <input
        accept="image/*"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void insertImage(file);
          }
        }}
        ref={fileInputRef}
        type="file"
      />
      <div
        className="rich-editor-surface"
        contentEditable
        data-placeholder="输入产品详情，可插入文字、列表和图片"
        onInput={syncHtml}
        ref={editorRef}
        suppressContentEditableWarning
      />
      {isUploading ? <span className="muted-text">图片上传中...</span> : null}
    </div>
  );
}
