// ─── GenericList ─────────────────────────────────────────────────────────────
// Reusable data table with pagination, sort, search, loading, and empty states.
// Matches the existing ZIEN design system (rounded-[32px] card, uppercase headers).

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ColumnDef, SortState, PaginationState, ListFetchParams, ListFetchResult } from './types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface GenericListProps<T> {
    columns: ColumnDef<T>[];
    /** Fetch function — called whenever page, sort, or search changes */
    fetchData: (params: ListFetchParams) => Promise<ListFetchResult<T>>;
    /** Unique key extractor per row */
    rowKey: (row: T) => string;
    /** Rows per page (default 20) */
    perPage?: number;
    /** Show search input (default true) */
    searchable?: boolean;
    /** Search placeholder text */
    searchPlaceholder?: string;
    /** Called when a row is clicked */
    onRowClick?: (row: T) => void;
    /** Header actions (e.g. "Add" button) rendered top-right */
    actions?: React.ReactNode;
    /** Empty state message */
    emptyMessage?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GenericList<T>({
    columns,
    fetchData,
    rowKey,
    perPage = 20,
    searchable = true,
    searchPlaceholder = 'Search...',
    onRowClick,
    actions,
    emptyMessage = 'No records found',
}: GenericListProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortState | undefined>();
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        perPage,
        total: 0,
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchData({
                page: pagination.page,
                perPage: pagination.perPage,
                sort,
                search: search || undefined,
            });
            setData(result.data);
            setPagination((prev) => ({ ...prev, total: result.total }));
        } catch (err) {
            console.error('GenericList fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchData, pagination.page, pagination.perPage, sort, search]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSort = (col: ColumnDef<T>) => {
        if (!col.sortable) return;
        setSort((prev) =>
            prev?.column === col.key && prev.direction === 'asc'
                ? { column: col.key, direction: 'desc' }
                : { column: col.key, direction: 'asc' },
        );
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));

    // ─── Search debounce ────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const id = setTimeout(() => {
            setSearch(searchInput);
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 350);
        return () => clearTimeout(id);
    }, [searchInput]);

    return (
        <div className="space-y-4">
            {/* ─── Toolbar ───────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4">
                {searchable ? (
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                        />
                    </div>
                ) : (
                    <div />
                )}
                {actions}
            </div>

            {/* ─── Table ────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={col.width ? { width: col.width } : undefined}
                                    onClick={() => handleSort(col)}
                                    className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 ${col.sortable ? 'cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-300' : ''
                                        }`}
                                >
                                    <span className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sort?.column === col.key && (
                                            sort.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-zinc-400 text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={`transition-colors ${onRowClick
                                            ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                        }`}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-6 py-4 text-sm">
                                            {col.render
                                                ? col.render(row, idx)
                                                : String((row as any)[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ─── Pagination ──────────────────────────────────────────────────── */}
                {!loading && pagination.total > pagination.perPage && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {pagination.total} total
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 disabled:opacity-30"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-bold">
                                {pagination.page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                                disabled={pagination.page >= totalPages}
                                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 disabled:opacity-30"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
