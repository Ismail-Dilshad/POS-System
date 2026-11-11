import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFocusManagement } from '@/hooks/use-focus-management';
import { useTranslation } from '@/hooks/use-translation';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ExportTransactionsByMonthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (monthStr: string) => Promise<void>;
    /** i18n key prefix for labels (e.g. "transactions.export_by_month" or "purchase.export_by_month"). */
    i18nKey?: string;
}

const MONTH_KEYS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
] as const;

/** English month names for the export period display (always in English). */
const MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const getDefaultMonth = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function parseMonthStr(monthStr: string): { year: number; month: number } {
    const [y, m] = monthStr.split('-').map(Number);
    return { year: y || new Date().getFullYear(), month: m || 1 };
}

function toMonthStr(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}

function getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getMonthRangeLabelEn(monthStr: string): string {
    const { year, month } = parseMonthStr(monthStr);
    const lastDay = getLastDayOfMonth(year, month);
    const monthName = MONTH_NAMES_EN[month - 1];
    return `1 ${monthName} ${year} – ${lastDay} ${monthName} ${year}`;
}

const YEAR_MIN_OFFSET = 20;
const YEAR_MAX_OFFSET = 1;

const DEFAULT_I18N_KEY = 'transactions.export_by_month';

export function ExportTransactionsByMonthModal({
    isOpen,
    onClose,
    onExport,
    i18nKey = DEFAULT_I18N_KEY,
}: ExportTransactionsByMonthModalProps) {
    const { t } = useTranslation();
    useFocusManagement(isOpen);
    const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth);
    const [isExporting, setIsExporting] = useState(false);

    const { year, month } = useMemo(
        () => parseMonthStr(selectedMonth),
        [selectedMonth],
    );

    const yearRange = useMemo(() => {
        const now = new Date();
        return {
            min: now.getFullYear() - YEAR_MIN_OFFSET,
            max: now.getFullYear() + YEAR_MAX_OFFSET,
        };
    }, []);

    const periodLabel = useMemo(
        () => getMonthRangeLabelEn(selectedMonth),
        [selectedMonth],
    );

    useEffect(() => {
        if (isOpen) {
            setSelectedMonth(getDefaultMonth());
        }
    }, [isOpen]);

    const setYear = useCallback((newYear: number) => {
        setSelectedMonth((prev) => {
            const { month: m } = parseMonthStr(prev);
            return toMonthStr(newYear, m);
        });
    }, []);

    const setMonth = useCallback((newMonth: number) => {
        setSelectedMonth((prev) => {
            const { year: y } = parseMonthStr(prev);
            return toMonthStr(y, newMonth);
        });
    }, []);

    const handlePrevYear = useCallback(() => {
        if (year > yearRange.min) setYear(year - 1);
    }, [year, yearRange.min, setYear]);

    const handleNextYear = useCallback(() => {
        if (year < yearRange.max) setYear(year + 1);
    }, [year, yearRange.max, setYear]);

    const handleExport = useCallback(async () => {
        if (isExporting || !selectedMonth) return;
        setIsExporting(true);
        try {
            await onExport(selectedMonth);
            onClose();
        } finally {
            setIsExporting(false);
        }
    }, [selectedMonth, isExporting, onExport, onClose]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                if (!isExporting) onClose();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                handleExport();
            }
        },
        [isOpen, isExporting, onClose, handleExport],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open && !isExporting) onClose();
        },
        [isExporting, onClose],
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="flex max-h-[95vh] flex-col overflow-hidden p-0 sm:max-w-md"
                hideClose={false}
            >
                <DialogHeader className="border-b border-blue-200 px-6 py-4 dark:border-blue-800">
                    <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-blue-800 dark:text-blue-200">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>{t(`${i18nKey}.title`)}</span>
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-muted-foreground">
                        {t(`${i18nKey}.description`)}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 px-6 py-5">
                    <div className="grid gap-2">
                        <Label className="text-sm font-medium text-foreground">
                            {t(`${i18nKey}.year`)}
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handlePrevYear}
                                disabled={isExporting || year <= yearRange.min}
                                aria-label={t(`${i18nKey}.prev_year`)}
                                className="h-11 w-11 shrink-0 border-blue-200 dark:border-blue-800"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span
                                className="min-w-[4rem] flex-1 rounded-md border border-blue-200 bg-muted/30 px-3 py-2 text-center text-sm font-medium dark:border-blue-800"
                                aria-live="polite"
                            >
                                {year}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleNextYear}
                                disabled={isExporting || year >= yearRange.max}
                                aria-label={t(`${i18nKey}.next_year`)}
                                className="h-11 w-11 shrink-0 border-blue-200 dark:border-blue-800"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="export-month-select"
                            className="text-sm font-medium text-foreground"
                        >
                            {t(`${i18nKey}.select_month`)}
                        </Label>
                        <Select
                            value={String(month)}
                            onValueChange={(v) => setMonth(Number(v))}
                            disabled={isExporting}
                        >
                            <SelectTrigger
                                id="export-month-select"
                                className="h-11 w-full border-blue-200 bg-background focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-blue-800 dark:focus:border-blue-600 dark:focus:ring-blue-800"
                                aria-describedby="export-period-label"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-blue-200 dark:border-blue-800">
                                {MONTH_KEYS.map((key, i) => (
                                    <SelectItem
                                        key={key}
                                        value={String(i + 1)}
                                        className="cursor-pointer"
                                    >
                                        {MONTH_NAMES_EN[i]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <p
                        id="export-period-label"
                        className="text-xs font-medium text-muted-foreground"
                    >
                        {t(`${i18nKey}.period`)}
                    </p>
                    <p
                        className="rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
                        aria-live="polite"
                    >
                        {periodLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t(`${i18nKey}.hint`)}
                    </p>
                </div>

                <DialogFooter className="flex flex-row flex-wrap gap-3 border-t border-border px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isExporting}
                        className="min-w-[5rem] flex-1 border-border sm:flex-none"
                    >
                        {t(`${i18nKey}.cancel`)}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="min-w-[5rem] flex-1 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 sm:flex-none"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('common.loading')}
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                {t(`${i18nKey}.export`)}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
