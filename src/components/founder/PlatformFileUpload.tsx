import React, { useState, useCallback } from 'react';
import { Upload, FileJson, FileSpreadsheet, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';

const ALLOWED_TYPES = [
    'application/json',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface PlatformFileUploadProps {
    /** Supabase storage bucket name */
    bucket?: string;
    /** Subfolder path in the bucket */
    folder?: string;
    /** Called after successful upload with the file path */
    onUploaded?: (path: string) => void;
    /** Restrict file types (default: JSON + CSV) */
    accept?: string;
}

export default function PlatformFileUpload({
    bucket = 'platform-config',
    folder = 'uploads',
    onUploaded,
    accept = '.json,.csv,.xlsx',
}: PlatformFileUploadProps) {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const validate = (f: File): string | null => {
        if (!ALLOWED_TYPES.includes(f.type) && !f.name.match(/\.(json|csv|xlsx?)$/i)) {
            return 'Only JSON, CSV, and XLSX files are allowed';
        }
        if (f.size > MAX_SIZE) return 'File must be less than 5 MB';
        return null;
    };

    const readPreview = (f: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            setPreview(text.slice(0, 2000));
        };
        reader.readAsText(f);
    };

    const handleFile = useCallback((f: File) => {
        const err = validate(f);
        if (err) {
            setResult({ ok: false, msg: err });
            return;
        }
        setFile(f);
        setResult(null);
        if (f.name.endsWith('.json') || f.name.endsWith('.csv')) {
            readPreview(f);
        } else {
            setPreview(null);
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);

        try {
            const ts = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${folder}/${ts}_${safeName}`;

            const { error } = await supabase.storage.from(bucket).upload(path, file, {
                upsert: false,
                contentType: file.type || 'application/octet-stream',
            });

            if (error) throw error;
            setResult({ ok: true, msg: `Uploaded to ${bucket}/${path}` });
            onUploaded?.(path);
            setFile(null);
            setPreview(null);
        } catch (err: any) {
            setResult({ ok: false, msg: err.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const icon = file?.name.endsWith('.json') ? <FileJson size={20} /> : <FileSpreadsheet size={20} />;

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${dragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
            >
                <Upload size={28} className="mx-auto text-zinc-400 mb-2" />
                <p className="text-xs text-zinc-500 mb-2">
                    Drag and drop a file here, or
                </p>
                <label className="inline-block cursor-pointer px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    Browse
                    <input
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                </label>
                <p className="text-[10px] text-zinc-400 mt-2">JSON, CSV, XLSX / Max 5 MB</p>
            </div>

            {/* Selected file */}
            {file && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div className="text-blue-600">{icon}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{file.name}</p>
                        <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="max-h-40 overflow-auto bg-zinc-950 text-green-400 text-[11px] font-mono p-3 rounded-xl">
                    <pre className="whitespace-pre-wrap">{preview}</pre>
                </div>
            )}

            {/* Upload button */}
            {file && (
                <button
                    onClick={upload}
                    disabled={uploading}
                    className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {uploading ? 'Uploading...' : 'Upload File'}
                </button>
            )}

            {/* Result */}
            {result && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${result.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {result.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {result.msg}
                </div>
            )}
        </div>
    );
}
