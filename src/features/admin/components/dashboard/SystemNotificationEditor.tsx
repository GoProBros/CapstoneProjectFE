"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import SystemNotificationEditorToolbar from "./SystemNotificationEditorToolbar";

interface SystemNotificationEditorProps {
  editor: Editor | null;
  characterCount: number;
  maxLength: number;
}

export default function SystemNotificationEditor({
  editor,
  characterCount,
  maxLength,
}: SystemNotificationEditorProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 max-w-full">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          Soạn thảo nội dung
        </p>

        <SystemNotificationEditorToolbar editor={editor} />

        <EditorContent editor={editor} />
      </div>

      <p
        className={`text-xs text-right ${
          characterCount > maxLength
            ? "text-red-600 dark:text-red-400"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        Giới hạn ký tự: {characterCount}/{maxLength}
      </p>
    </div>
  );
}
