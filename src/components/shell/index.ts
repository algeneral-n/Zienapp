// ─── Shell Barrel Export ──────────────────────────────────────────────────────
// Central import point: import { ModuleShell, GenericList, ... } from '../components/shell';

export { ModuleShell } from './ModuleShell';
export { GenericList } from './GenericList';
export { GenericDetail } from './GenericDetail';
export { GenericForm } from './GenericForm';
export { TimelinePanel } from './TimelinePanel';
export { AttachmentsPanel } from './AttachmentsPanel';
export { CommentsPanel } from './CommentsPanel';
export { AISidePanel } from './AISidePanel';
export { PermissionActions } from './PermissionActions';

export type {
    TabConfig,
    ModuleConfig,
    ColumnDef,
    SortState,
    PaginationState,
    ListFetchParams,
    ListFetchResult,
    DetailTab,
    FieldType,
    SelectOption,
    FormFieldDef,
    FormSection,
    TimelineEvent,
    Attachment,
    Comment,
    AISidePanelContext,
    ActionDef,
} from './types';
