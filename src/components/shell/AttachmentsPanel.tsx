// ─── AttachmentsPanel ────────────────────────────────────────────────────────
// File upload and attachment display panel for any entity.

import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, Download, Loader2 } from 'lucide-react';
import type { Attachment } from './types';

interface AttachmentsPanelProps {
    attachments: Attachment[];
    loading?: boolean;
    /** Called when user selects files to upload */
    onUpload?: (files: File[]) => Promise<void>;
    /** Called when user deletes an attachment */
    onDelete?: (id: string) => Promise<void>;
    /** Whether uploads are allowed (hides the upload button when false) */
    canUpload?: boolean;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function AttachmentsPanel({
    attachments,
    loading = false,
    onUpload,
    onDelete,
    canUpload = true,
}: AttachmentsPanelProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length || !onUpload) return;
        setUploading(true);
        try {
            await onUpload(Array.from(files));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload area */}
            {canUpload && onUpload && (
                <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-600/50 transition-colors"
                >
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFiles}
                    />
                    {uploading ? (
                        <Loader2 size={24} className="mx-auto animate-spin text-blue-600 mb-2" />
                    ) : (
                        <Upload size={24} className="mx-auto text-zinc-400 mb-2" />
                    )}
                    <p className="text-xs text-zinc-500 font-medium">
                        {uploading ? 'Uploading...' : 'Click to upload files'}
                    </p>
                </div>
            )}

            {/* File list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-6">
                    <FileText size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-400">No attachments</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((att) => (
                        <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                        >
                            <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{att.file_name}</p>
                                <p className="text-[10px] text-zinc-400">
                                    {formatSize(att.file_size)}
                                    {att.uploaded_by_name && ` · ${att.uploaded_by_name}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg text-zinc-400 hover:text-blue-600 transition-colors"
                                >
                                    <Download size={16} />
                                </a>
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(att.id)}
                                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
