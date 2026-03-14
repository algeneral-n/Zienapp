// ─── AISidePanel ─────────────────────────────────────────────────────────────
// Module-level AI assistant panel that connects to RARE.
// Opens the global RARE chat with the module's context pre-loaded.

import React from 'react';
import { Sparkles, Send } from 'lucide-react';
import type { AISidePanelContext } from './types';

interface AISidePanelProps {
    context: AISidePanelContext;
    /** Quick prompt suggestions for this module */
    suggestions?: string[];
}

function dispatchRareOpen(prompt?: string, moduleCode?: string) {
    // The global FloatingActions component listens for 'open-rare-chat'
    window.dispatchEvent(
        new CustomEvent('open-rare-chat', {
            detail: { prompt, moduleCode },
        }),
    );
}

export function AISidePanel({ context, suggestions = [] }: AISidePanelProps) {
    const [input, setInput] = React.useState('');

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        dispatchRareOpen(trimmed, context.moduleCode);
        setInput('');
    };

    const handleSuggestion = (prompt: string) => {
        dispatchRareOpen(prompt, context.moduleCode);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center">
                    <Sparkles size={18} className="text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">RARE AI</h3>
                    <p className="text-[10px] text-zinc-500 font-medium">
                        AI assistant for {context.moduleCode}
                    </p>
                </div>
            </div>

            {/* Entity context */}
            {context.entitySummary && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Context</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{context.entitySummary}</p>
                </div>
            )}

            {/* Quick suggestions */}
            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSuggestion(s)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600/5 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/10 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask RARE anything..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
