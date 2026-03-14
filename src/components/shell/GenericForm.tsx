// ─── GenericForm ─────────────────────────────────────────────────────────────
// Dynamic form builder using react-hook-form.
// Renders fields from a declarative FormSection[] config.
// Matches ZIEN design: rounded-xl inputs, uppercase labels, blue-600 submit.

import React from 'react';
import { useForm, type FieldValues, type DefaultValues, type Path } from 'react-hook-form';
import { Loader2, X } from 'lucide-react';
import type { FormSection, FormFieldDef } from './types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface GenericFormProps<T extends FieldValues> {
    /** Form field layout */
    sections: FormSection[];
    /** Called with validated form data on submit */
    onSubmit: (data: T) => Promise<void> | void;
    /** Cancel handler (renders Cancel button when provided) */
    onCancel?: () => void;
    /** Submit button label */
    submitLabel?: string;
    /** Default values for the form */
    defaultValues?: DefaultValues<T>;
    /** Whether the form is currently submitting */
    submitting?: boolean;
    /** Form title (rendered inside the form card) */
    title?: string;
}

// ─── Field Renderer ──────────────────────────────────────────────────────────

const inputBase =
    'w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors';

function RenderField<T extends FieldValues>({
    field,
    register,
    errors,
}: {
    field: FormFieldDef;
    register: ReturnType<typeof useForm<T>>['register'];
    errors: Record<string, any>;
}) {
    const name = field.name as Path<T>;
    const error = errors[field.name];

    const registerOpts: Record<string, any> = {};
    if (field.required) registerOpts.required = `${field.label} is required`;
    if (field.type === 'number') registerOpts.valueAsNumber = true;
    if (field.min !== undefined) registerOpts.min = { value: field.min, message: `Minimum ${field.min}` };
    if (field.max !== undefined) registerOpts.max = { value: field.max, message: `Maximum ${field.max}` };

    if (field.type === 'hidden') {
        return <input type="hidden" {...register(name, registerOpts)} />;
    }

    return (
        <div className={field.colSpan ? `col-span-${field.colSpan}` : ''}>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {field.type === 'textarea' ? (
                <textarea
                    {...register(name, registerOpts)}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    rows={3}
                    className={inputBase}
                />
            ) : field.type === 'select' ? (
                <select
                    {...register(name, registerOpts)}
                    disabled={field.disabled}
                    className={inputBase}
                >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        {...register(name, registerOpts)}
                        disabled={field.disabled}
                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {field.placeholder}
                    </span>
                </label>
            ) : (
                <input
                    type={field.type}
                    {...register(name, registerOpts)}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    min={field.min}
                    max={field.max}
                    className={inputBase}
                />
            )}

            {error && (
                <p className="mt-1 text-xs text-red-500">{error.message}</p>
            )}
        </div>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GenericForm<T extends FieldValues>({
    sections,
    onSubmit,
    onCancel,
    submitLabel = 'Save',
    defaultValues,
    submitting = false,
    title,
}: GenericFormProps<T>) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<T>({ defaultValues });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {title && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-zinc-600">
                            <X size={20} />
                        </button>
                    )}
                </div>
            )}

            {sections.map((section, si) => (
                <div key={si} className="space-y-4">
                    {section.title && (
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            {section.title}
                        </h4>
                    )}
                    <div className={`grid grid-cols-${section.columns || 2} gap-4`}>
                        {section.fields.map((field) => (
                            <RenderField
                                key={field.name}
                                field={field}
                                register={register}
                                errors={errors}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex items-center gap-3 justify-end pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
