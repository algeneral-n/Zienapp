// ─── TimelinePanel ───────────────────────────────────────────────────────────
// Displays a chronological activity / change log for an entity.

import React from 'react';
import { Clock } from 'lucide-react';
import type { TimelineEvent } from './types';

interface TimelinePanelProps {
    events: TimelineEvent[];
    loading?: boolean;
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

export function TimelinePanel({ events, loading = false }: TimelinePanelProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8">
                <Clock size={24} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-700" />

            <div className="space-y-6">
                {events.map((ev) => (
                    <div key={ev.id} className="flex gap-4 relative">
                        {/* Dot */}
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0 z-10 text-xs font-black">
                            {ev.actor_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold">{ev.actor_name}</span>
                                <span className="text-xs text-zinc-500">{ev.action}</span>
                                <span className="text-[10px] text-zinc-400 ml-auto">
                                    {formatRelative(ev.created_at)}
                                </span>
                            </div>
                            {ev.details && (
                                <p className="text-xs text-zinc-500 mt-1">{ev.details}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
