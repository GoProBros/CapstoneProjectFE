'use client';

import { useState, useRef, useCallback } from 'react';
import { fileService } from '@/services/files/fileService';
import type { FileResponse } from '@/types/file';
import { FileCategory } from '@/types/file';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadFileModalProps {
    /** ID of the entity this file belongs to (relatedEntityId) */
    entityId: string;
    /** File category (determines backend storage bucket and association) */
    category: FileCategory;
    /** Human-readable label shown under the title (e.g. report name) */
    entityLabel?: string;
    /** Accepted file types, defaults to common document formats */
    accept?: string;
    /** Called when user closes without uploading */
    onClose: () => void;
    /** Called with the uploaded file info after a successful upload */
    onUploaded: (file: FileResponse) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Reusable file upload modal.
 * Supports drag-and-drop or click-to-select.
 * Calls `onUploaded` with the FileResponse after a successful upload.
 */
export default function UploadFileModal({
    entityId,
    category,
    entityLabel,
    accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv',
    onClose,
    onUploaded,
}: UploadFileModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setError(null);
        try {
            const result = await fileService.uploadFile({
                file: selectedFile,
                category,
                relatedEntityId: entityId,
            });
            onUploaded(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể upload file, vui lòng thử lại');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="min-w-0 flex-1 mr-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            Upload tài liệu
                        </h3>
                        {entityLabel && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                {entityLabel}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none ${
                            dragging
                                ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <svg
                            className="w-10 h-10 mx-auto mb-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {dragging ? 'Thả file vào đây' : 'Kéo thả file hoặc nhấn để chọn'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, Word, Excel, CSV</p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Selected file preview */}
                    {selectedFile && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
                            <svg
                                className="w-8 h-8 shrink-0 text-purple-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={e => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    if (inputRef.current) inputRef.current.value = '';
                                }}
                                disabled={uploading}
                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Bỏ qua
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {uploading && <Spinner />}
                        {uploading ? 'Đang upload...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}
