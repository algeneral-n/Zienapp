// ─── CommentsPanel ───────────────────────────────────────────────────────────
// Comments / activity feed for any entity. Supports adding new comments.

import React, { useState } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import type { Comment } from './types';

interface CommentsPanelProps {
    comments: Comment[];
    loading?: boolean;
    /** Called when user submits a new comment. Returns the created Comment. */
    onAdd?: (body: string) => Promise<void>;
    /** Whether adding comments is allowed */
    canComment?: boolean;
}

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export function CommentsPanel({
    comments,
    loading = false,
    onAdd,
    canComment = true,
}: CommentsPanelProps) {
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = body.trim();
        if (!trimmed || !onAdd) return;
        setSending(true);
        try {
            await onAdd(trimmed);
            setBody('');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Comment input */}
            {canComment && onAdd && (
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                        className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                    <button
                        type="submit"
                        disabled={!body.trim() || sending}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            )}

            {/* Comment list */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-6">
                    <MessageSquare size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-400">No comments yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-black">
                                {c.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{c.author_name}</span>
                                    <span className="text-[10px] text-zinc-400">
                                        {formatRelative(c.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                                    {c.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
