import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import {
    categoryService,
    type CategoryImportPreview,
    type CategoryImportResult,
} from '@/services/business/categoryService';
import { Loader2, Upload } from 'lucide-react';
import { useEffect, useReducer } from 'react';

interface ImportState {
    file: File | null;
    skipDuplicates: boolean;
    status: 'select' | 'validating' | 'ready' | 'importing' | 'complete';
    preview: CategoryImportPreview | null;
    result: CategoryImportResult | null;
    error: string | null;
}

interface CategoryImportPanelProps {
    onBack: () => void;
    onImported: () => void;
    onBusyChange: (busy: boolean) => void;
}

export default function CategoryImportPanel({
    onBack,
    onImported,
    onBusyChange,
}: CategoryImportPanelProps) {
    const { t } = useTranslation();
    const [state, update] = useReducer(
        (current: ImportState, patch: Partial<ImportState>): ImportState => ({
            ...current,
            ...patch,
        }),
        {
            file: null,
            skipDuplicates: true,
            status: 'select',
            preview: null,
            result: null,
            error: null,
        },
    );
    const busy = state.status === 'validating' || state.status === 'importing';

    useEffect(() => {
        onBusyChange(busy);
        return () => onBusyChange(false);
    }, [busy, onBusyChange]);

    const selectFile = (file: File | null) => {
        const error =
            file &&
            (!file.name.toLowerCase().endsWith('.csv') ||
                file.size > 10 * 1024 * 1024)
                ? t('category_import.invalid_file')
                : null;
        update({
            file: error ? null : file,
            error,
            status: 'select',
            preview: null,
            result: null,
        });
    };

    const validate = async () => {
        if (!state.file || busy) return;
        update({ status: 'validating', error: null });
        try {
            const response = await categoryService.validateImport(
                state.file,
                state.skipDuplicates,
            );
            if (response.success && response.data) {
                update({ preview: response.data, status: 'ready' });
            } else {
                update({
                    status: 'select',
                    error:
                        Object.values(response.errors ?? {})
                            .flat()
                            .join(' ') ||
                        response.message ||
                        t('category_import.failed'),
                });
            }
        } catch {
            update({ status: 'select', error: t('category_import.failed') });
        }
    };

    const importCategories = async () => {
        if (
            !state.file ||
            state.status !== 'ready' ||
            !state.preview ||
            state.preview.summary.invalid_rows > 0 ||
            state.preview.summary.create_count === 0
        )
            return;
        update({ status: 'importing', error: null });
        try {
            const response = await categoryService.processImport(
                state.file,
                state.skipDuplicates,
            );
            if (response.success && response.data) {
                update({ result: response.data, status: 'complete' });
                if (response.data.success_count > 0) onImported();
            } else {
                update({
                    status: 'ready',
                    error:
                        Object.values(response.errors ?? {})
                            .flat()
                            .join(' ') ||
                        response.message ||
                        t('category_import.failed'),
                });
            }
        } catch {
            update({ status: 'ready', error: t('category_import.failed') });
        }
    };

    return (
        <section className="space-y-4" aria-busy={busy}>
            <h3 className="font-semibold">{t('category_import.title')}</h3>
            <p className="text-sm text-muted-foreground">
                {t('category_import.instructions')}
            </p>
            <div className="space-y-2">
                <Label htmlFor="category-csv">
                    {t('category_import.file')}
                </Label>
                <Input
                    id="category-csv"
                    type="file"
                    accept=".csv,text/csv"
                    autoFocus
                    disabled={busy}
                    onChange={(event) =>
                        selectFile(event.target.files?.[0] ?? null)
                    }
                />
            </div>
            <div className="flex items-center gap-2">
                <Checkbox
                    id="category-skip-duplicates"
                    checked={state.skipDuplicates}
                    disabled={busy}
                    onCheckedChange={(checked) =>
                        update({
                            skipDuplicates: checked === true,
                            status: 'select',
                            preview: null,
                            result: null,
                            error: null,
                        })
                    }
                />
                <Label htmlFor="category-skip-duplicates">
                    {t('category_import.skip_duplicates')}
                </Label>
            </div>
            {state.error && (
                <p role="alert" className="text-sm text-destructive">
                    {state.error}
                </p>
            )}
            {state.preview && !state.result && (
                <div className="space-y-2">
                    <p role="status" className="text-sm">
                        {t('category_import.summary', {
                            total: state.preview.summary.total_rows,
                            create: state.preview.summary.create_count,
                            skip: state.preview.summary.skip_count,
                            invalid: state.preview.summary.invalid_rows,
                        })}
                    </p>
                    <div
                        className="max-h-60 overflow-auto rounded-md border"
                        tabIndex={0}
                        aria-label={t('category_import.preview')}
                    >
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th scope="col" className="p-2">
                                        {t('category.name')}
                                    </th>
                                    <th scope="col" className="p-2">
                                        {t('category_import.status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.preview.categories.map((row) => (
                                    <tr
                                        key={row.rowNumber}
                                        className="border-b last:border-0"
                                    >
                                        <td className="p-2">{row.name}</td>
                                        <td className="p-2">
                                            {row.isValid
                                                ? t(
                                                      `category_import.${row.action}`,
                                                  )
                                                : row.errors.join(' ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {state.preview.summary.create_count === 0 && (
                        <p className="text-sm text-muted-foreground">
                            {t('category_import.no_new')}
                        </p>
                    )}
                </div>
            )}
            {state.result && (
                <div className="space-y-2" role="status">
                    <p>
                        {t('category_import.result', {
                            created: state.result.success_count,
                            skipped: state.result.skip_count,
                            failed: state.result.error_count,
                        })}
                    </p>
                    {state.result.error_count > 0 && (
                        <ul className="max-h-40 overflow-auto text-sm text-destructive">
                            {state.result.details.map((detail, index) => (
                                <li key={index}>{detail}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={busy}
                >
                    {t('category_import.back')}
                </Button>
                {!state.result &&
                    (state.status === 'ready' ||
                    state.status === 'importing' ? (
                        <Button
                            type="button"
                            onClick={importCategories}
                            disabled={
                                busy ||
                                !state.preview ||
                                state.preview.summary.invalid_rows > 0 ||
                                state.preview.summary.create_count === 0
                            }
                        >
                            {busy ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 size-4" />
                            )}
                            {t(
                                state.status === 'importing'
                                    ? 'category_import.importing'
                                    : 'category_import.import',
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={validate}
                            disabled={!state.file || busy}
                        >
                            {busy && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            {t(
                                busy
                                    ? 'category_import.validating'
                                    : 'category_import.preview',
                            )}
                        </Button>
                    ))}
            </div>
        </section>
    );
}
