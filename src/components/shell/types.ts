// ─── Module Shell Type Definitions ───────────────────────────────────────────
// Shared interfaces for the entire Module Shell system.

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Module & Navigation ─────────────────────────────────────────────────────

export interface TabConfig {
    icon: LucideIcon;
    label: string;
    path: string;
    /** Permission code required to see this tab (e.g. 'hr.write') */
    permission?: string;
}

export interface ModuleConfig {
    /** Module code matching DB modules table (e.g. 'hr', 'crm', 'accounting') */
    moduleCode: string;
    /** Permission code for basic read access */
    requiredPermission?: string;
    /** Navigation tabs */
    tabs: TabConfig[];
}

// ─── Generic List / Data Table ───────────────────────────────────────────────

export interface ColumnDef<T = any> {
    key: string;
    header: string;
    sortable?: boolean;
    width?: string;
    render?: (row: T, index: number) => ReactNode;
}

export interface SortState {
    column: string;
    direction: 'asc' | 'desc';
}

export interface PaginationState {
    page: number;
    perPage: number;
    total: number;
}

export interface ListFetchParams {
    page: number;
    perPage: number;
    sort?: SortState;
    search?: string;
}

export interface ListFetchResult<T> {
    data: T[];
    total: number;
}

// ─── Generic Detail ──────────────────────────────────────────────────────────

export interface DetailTab {
    key: string;
    label: string;
    icon?: LucideIcon;
    permission?: string;
    content: ReactNode;
}

// ─── Generic Form ────────────────────────────────────────────────────────────

export type FieldType =
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'date'
    | 'time'
    | 'datetime'
    | 'checkbox'
    | 'hidden';

export interface SelectOption {
    value: string;
    label: string;
}

export interface FormFieldDef {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: SelectOption[];
    /** Grid column span (1-4, default 1) */
    colSpan?: number;
    /** Min value for number fields */
    min?: number;
    /** Max value for number fields */
    max?: number;
    disabled?: boolean;
    /** Default value for the field */
    defaultValue?: string | number | boolean;
}

export interface FormSection {
    title?: string;
    /** Grid columns (default 2) */
    columns?: number;
    fields: FormFieldDef[];
}

// ─── Timeline / Activity ─────────────────────────────────────────────────────

export interface TimelineEvent {
    id: string;
    action: string;
    actor_name: string;
    actor_avatar?: string;
    created_at: string;
    details?: string;
    metadata?: Record<string, unknown>;
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export interface Attachment {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    url: string;
    uploaded_by_name?: string;
    created_at: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
    id: string;
    body: string;
    author_name: string;
    author_avatar?: string;
    created_at: string;
    updated_at?: string;
}

// ─── AI Side Panel ───────────────────────────────────────────────────────────

export interface AISidePanelContext {
    moduleCode: string;
    entityType?: string;
    entityId?: string;
    entitySummary?: string;
}

// ─── Permission Actions ──────────────────────────────────────────────────────

export interface ActionDef {
    key: string;
    label: string;
    icon?: LucideIcon;
    permission?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
}
