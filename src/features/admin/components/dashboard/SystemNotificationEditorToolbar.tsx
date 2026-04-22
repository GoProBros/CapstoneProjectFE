"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { Editor } from "@tiptap/react";

interface SystemNotificationEditorToolbarProps {
  editor: Editor | null;
}

function getToolbarButtonClass(isActive: boolean) {
  return `h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition-colors ${
    isActive
      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
  }`;
}

export default function SystemNotificationEditorToolbar({
  editor,
}: SystemNotificationEditorToolbarProps) {
  const [, forceRender] = useState(0);
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const linkPopupRef = useRef<HTMLDivElement | null>(null);
  const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState("https://");
  const [linkTextInput, setLinkTextInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const refreshToolbar = () => {
      forceRender((prev) => prev + 1);
    };

    editor.on("selectionUpdate", refreshToolbar);
    editor.on("transaction", refreshToolbar);
    editor.on("focus", refreshToolbar);
    editor.on("blur", refreshToolbar);

    return () => {
      editor.off("selectionUpdate", refreshToolbar);
      editor.off("transaction", refreshToolbar);
      editor.off("focus", refreshToolbar);
      editor.off("blur", refreshToolbar);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      savedSelection.current = null;
      return;
    }

    const syncSelection = () => {
      savedSelection.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      };
    };

    syncSelection();
    editor.on("selectionUpdate", syncSelection);

    return () => {
      editor.off("selectionUpdate", syncSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (!isLinkPopupOpen) {
      return;
    }

    const handlePointerDownOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;

      if (linkPopupRef.current && !linkPopupRef.current.contains(target)) {
        setIsLinkPopupOpen(false);
        setLinkError(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLinkPopupOpen(false);
        setLinkError(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLinkPopupOpen]);

  const rememberSelection = () => {
    if (!editor) {
      return;
    }

    savedSelection.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
  };

  const restoreSelection = () => {
    if (!editor) {
      return;
    }

    const selection = savedSelection.current;

    if (selection) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: selection.from, to: selection.to })
        .run();
    } else {
      editor.commands.focus();
    }
  };

  const applyTextStyle = (attrs: {
    color?: string | null;
  }) => {
    if (!editor) {
      return;
    }

    restoreSelection();

    const nextColor = attrs.color ?? null;
    const hasColor = typeof nextColor === "string" && nextColor.trim().length > 0;
    if (!editor.schema.marks.textStyle) {
      return;
    }

    if (!hasColor) {
      editor.chain().focus().unsetMark("textStyle").run();
      return;
    }

    editor
      .chain()
      .focus()
      .setMark("textStyle", {
        color: nextColor,
      })
      .run();
  };

  const keepSelectionOnToolbarClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    rememberSelection();
  };

  const toggleUnderline = () => {
    if (!editor) {
      return;
    }

    restoreSelection();

    editor.chain().focus().toggleMark("underline").run();
  };

  const toggleBulletList = () => {
    if (!editor) {
      return;
    }

    restoreSelection();
    editor.chain().focus().toggleBulletList().run();
  };

  const openLinkPopup = () => {
    if (!editor) {
      return;
    }

    restoreSelection();

    const currentHref = (editor.getAttributes("link") as { href?: string }).href;
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ");

    if (!editor.schema.marks.link) {
      return;
    }

    setLinkUrlInput(currentHref || "https://");
    setLinkTextInput(selectedText);
    setLinkError(null);
    setIsLinkPopupOpen(true);
  };

  const applyLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editor) {
      return;
    }

    restoreSelection();

    if (!editor.schema.marks.link) {
      return;
    }

    const trimmedUrl = linkUrlInput.trim();

    if (!trimmedUrl) {
      setLinkError("Vui lòng nhập đường dẫn hợp lệ");
      return;
    }

    const href = /^(https?:\/\/|mailto:|tel:)/i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;
    const displayText = linkTextInput.trim();
    const attrs = {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
    };
    const { from, to, empty } = editor.state.selection;

    if (empty) {
      const insertedText = displayText || href;

      editor
        .chain()
        .focus()
        .insertContent(insertedText)
        .setTextSelection({ from, to: from + insertedText.length })
        .setMark("link", attrs)
        .setTextSelection(from + insertedText.length)
        .run();

      setIsLinkPopupOpen(false);
      setLinkError(null);
      return;
    }

    if (displayText) {
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, displayText)
        .setTextSelection({ from, to: from + displayText.length })
        .setMark("link", attrs)
        .setTextSelection(from + displayText.length)
        .run();
    } else {
      editor.chain().focus().setMark("link", attrs).run();
    }

    setIsLinkPopupOpen(false);
    setLinkError(null);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-900/70">
        <button
          type="button"
          onMouseDown={keepSelectionOnToolbarClick}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={getToolbarButtonClass(editor?.isActive("bold") ?? false)}
          disabled={!editor}
          title="In đậm"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          onMouseDown={keepSelectionOnToolbarClick}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={getToolbarButtonClass(editor?.isActive("italic") ?? false)}
          disabled={!editor}
          title="In nghiêng"
        >
          <em>I</em>
        </button>

        <button
          type="button"
          onMouseDown={keepSelectionOnToolbarClick}
          onClick={toggleUnderline}
          className={getToolbarButtonClass(editor?.isActive("underline") ?? false)}
          disabled={!editor}
          title="Gạch chân"
        >
          <u>U</u>
        </button>

        <button
          type="button"
          onMouseDown={keepSelectionOnToolbarClick}
          onClick={openLinkPopup}
          className={getToolbarButtonClass(editor?.isActive("link") ?? false)}
          disabled={!editor}
          title="Chèn link"
        >
          Link
        </button>

        <button
          type="button"
          onMouseDown={keepSelectionOnToolbarClick}
          onClick={toggleBulletList}
          className={getToolbarButtonClass(editor?.isActive("bulletList") ?? false)}
          disabled={!editor}
          title="Gạch đầu dòng"
        >
          • List
        </button>

        <label
          className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium ${
            editor?.isActive("textStyle")
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Màu chữ
          <input
            type="color"
            onPointerDown={rememberSelection}
            onFocus={rememberSelection}
            onChange={(event) => applyTextStyle({ color: event.target.value })}
            className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0"
            title="Đổi màu chữ"
          />
        </label>

        <button
          type="button"
          onMouseDown={keepSelectionOnToolbarClick}
          onClick={() => editor?.chain().focus().unsetAllMarks().run()}
          className="h-8 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          disabled={!editor}
        >
          Xóa định dạng
        </button>
      </div>

      {isLinkPopupOpen && (
        <div
          ref={linkPopupRef}
          className="absolute left-0 right-0 z-[90] mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <form onSubmit={applyLink} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Đường dẫn
              </label>
              <input
                type="text"
                value={linkUrlInput}
                onChange={(event) => setLinkUrlInput(event.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Văn bản hiển thị
              </label>
              <input
                type="text"
                value={linkTextInput}
                onChange={(event) => setLinkTextInput(event.target.value)}
                placeholder="Nhập văn bản hiển thị"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {linkError && (
              <p className="text-xs text-red-600 dark:text-red-400">{linkError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLinkPopupOpen(false);
                  setLinkError(null);
                }}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Áp dụng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}