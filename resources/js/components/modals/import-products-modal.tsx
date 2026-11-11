import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle,
    Download,
    Eye,
    EyeOff,
    FileText,
    RefreshCw,
    Upload,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ImportedProduct {
    rowNumber: number;
    name: string;
    category: string;
    supplier: string;
    barcode: string;
    secondary_barcode?: string | null;
    cost_price: number;
    sell_price: number;
    stock: number;
    min_stock: number;
    per_carton: number | null;
    isValid: boolean;
    errors: string[];
    action: 'create' | 'update' | 'skip';
}

interface ValidationSummary {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    createCount: number;
    updateCount: number;
}

interface ImportProgress {
    total: number;
    processed: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
    percentage: number;
}

interface ImportResults {
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
    message: string;
    created?: number;
    updated?: number;
    skipped?: number;
    total_processed?: number;
}

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: (importedData?: Partial<ImportResults> & { requiresRefresh?: boolean }) => void;
}

export function ImportProductsModal({
    isOpen,
    onClose,
}: ImportProductsModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    // File handling states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const validationController = useRef<AbortController | null>(null);
    const pendingRequest = useRef<'validate' | 'import' | null>(null);
    const importAttempted = useRef(false);
    const mounted = useRef(false);
    const [previewPage, setPreviewPage] = useState(1);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            validationController.current?.abort();
        };
    }, []);

    // Import options
    const [updateExisting, setUpdateExisting] = useState(false);
    const [skipDuplicates, setSkipDuplicates] = useState(true);

    // Processing states
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Data states
    const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>(
        [],
    );
    const [validationSummary, setValidationSummary] =
        useState<ValidationSummary | null>(null);
    const [importResults, setImportResults] = useState<ImportResults | null>(
        null,
    );
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    // View states
    const [currentStep, setCurrentStep] = useState<
        'upload' | 'validate' | 'preview' | 'importing' | 'complete'
    >('upload');
    const [showValidOnly, setShowValidOnly] = useState(false);
    const [showInvalidOnly, setShowInvalidOnly] = useState(false);

    // Handle file selection
    const handleFileSelect = (file: File) => {
        if (pendingRequest.current) return;
        setImportedProducts([]);
        setValidationSummary(null);
        setImportResults(null);
        setPreviewPage(1);
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError(t('import_products_modal.errors.select_csv'));
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            // 100MB limit (increased from 10MB)
            setError(t('import_products_modal.errors.file_size_limit'));
            return;
        }

        setSelectedFile(file);
        setError(null);
        setCurrentStep('upload');
    };

    // Handle drag and drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Validate file
    const handleValidateFile = async () => {
        if (!selectedFile || pendingRequest.current) return;

        const controller = new AbortController();
        validationController.current = controller;
        pendingRequest.current = 'validate';

        setIsValidating(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('update_existing', updateExisting ? '1' : '0');
            formData.append('skip_duplicates', skipDuplicates ? '1' : '0');

            const response = await axios.post(
                '/api/products/import/validate',
                formData,
                {
                    timeout: 300000, // 5 minutes timeout
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            if (controller.signal.aborted || !mounted.current) return;
            if (response.data.success) {
                const data = response.data.data;

                // Process validation results
                const products: ImportedProduct[] = [];
                const column = (row: string[], name: string): string => row[data.headers.indexOf(name)] ?? '';

                // Process valid rows
                data.valid_rows?.forEach(
                    (row: { row: number; data: string[]; action?: string }) => {
                        products.push({
                            rowNumber: row.row,
                            name: column(row.data, 'name') || '',
                            category: column(row.data, 'category') || '',
                            supplier: column(row.data, 'supplier') || '',
                            barcode: column(row.data, 'barcode') || '',
                            secondary_barcode: column(row.data, 'secondary_barcode') && column(row.data, 'secondary_barcode').trim() !== '' ? column(row.data, 'secondary_barcode').trim() : null,
                            cost_price: parseFloat(column(row.data, 'cost_price')) || 0,
                            sell_price: parseFloat(column(row.data, 'sell_price')) || 0,
                            stock: parseInt(column(row.data, 'stock')) || 0,
                            min_stock: parseInt(column(row.data, 'min_stock')) || 0,
                            per_carton: column(row.data, 'per_carton') ? parseInt(column(row.data, 'per_carton')) : null,
                            isValid: true,
                            errors: [],
                            action:
                                (row.action as 'create' | 'update' | 'skip') ||
                                'create',
                        });
                    },
                );

                // Process invalid rows
                data.invalid_rows?.forEach(
                    (row: { row: number; data: string[] }) => {
                        products.push({
                            rowNumber: row.row,
                            name: column(row.data, 'name') || '',
                            category: column(row.data, 'category') || '',
                            supplier: column(row.data, 'supplier') || '',
                            barcode: column(row.data, 'barcode') || '',
                            secondary_barcode: column(row.data, 'secondary_barcode') && column(row.data, 'secondary_barcode').trim() !== '' ? column(row.data, 'secondary_barcode').trim() : null,
                            cost_price: parseFloat(column(row.data, 'cost_price')) || 0,
                            sell_price: parseFloat(column(row.data, 'sell_price')) || 0,
                            stock: parseInt(column(row.data, 'stock')) || 0,
                            min_stock: parseInt(column(row.data, 'min_stock')) || 0,
                            per_carton: column(row.data, 'per_carton') ? parseInt(column(row.data, 'per_carton')) : null,
                            isValid: false,
                            errors: (row as { errors?: string[] }).errors || [],
                            action: 'skip',
                        });
                    },
                );

                // Calculate create/update counts
                const createCount = products.filter(
                    (p) => p.action === 'create' && p.isValid,
                ).length;
                const updateCount = products.filter(
                    (p) => p.action === 'update' && p.isValid,
                ).length;

                setImportedProducts(products);
                setValidationSummary({
                    totalRows: data.total_rows || 0,
                    validRows: data.valid_rows_count || 0,
                    invalidRows: data.invalid_rows_count || 0,
                    createCount: createCount,
                    updateCount: updateCount,
                });

                setCurrentStep('preview');
                setPreviewPage(1);
            } else {
                setError(response.data.message || t('import_products_modal.errors.validation_failed'));
            }
        } catch (err: unknown) {
            if (controller.signal.aborted || !mounted.current) return;
            setError(
                (err as { response?: { data?: { message?: string } } }).response
                    ?.data?.message || t('import_products_modal.errors.validation_failed'),
            );
        } finally {
            if (validationController.current === controller) {
                pendingRequest.current = null;
                validationController.current = null;
                if (mounted.current) setIsValidating(false);
            }
        }
    };

    // Import products with progress tracking
    const handleImportProducts = async () => {
        if (!selectedFile || pendingRequest.current || importAttempted.current || !validationSummary) return;
        pendingRequest.current = 'import';
        importAttempted.current = true;

        setIsImporting(true);
        setError(null);
        setCurrentStep('importing');
        setImportProgress(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('update_existing', updateExisting ? '1' : '0');
            formData.append('skip_duplicates', skipDuplicates ? '1' : '0');

            const response = await axios.post(
                '/api/products/import',
                formData,
                {
                    timeout: 300000, // 5 minutes timeout
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (!mounted.current) return;
                        if (progressEvent.total) {
                            const percentage = Math.round(
                                (progressEvent.loaded * 100) /
                                    progressEvent.total,
                            );
                            setImportProgress({
                                total: progressEvent.total,
                                processed: progressEvent.loaded,
                                imported: 0,
                                updated: 0,
                                skipped: 0,
                                errors: [],
                                percentage,
                            });
                        }
                    },
                },
            );

            if (!mounted.current) return;
            if (response.data.success) {
                const data = response.data.data;
                setImportResults(data);
                setCurrentStep('complete');

                // Build detailed success message
                const parts: string[] = [];
                if (data.created && data.created > 0) {
                    parts.push(`${data.created} ${t('import_products_modal.toast.created_text')}`);
                }
                if (data.updated && data.updated > 0) {
                    parts.push(`${data.updated} ${t('import_products_modal.toast.updated_text')}`);
                }
                if (data.skipped && data.skipped > 0) {
                    parts.push(`${data.skipped} ${t('import_products_modal.toast.skipped_text')}`);
                }

                const description =
                    parts.length > 0
                        ? parts.join(', ')
                        : t('import_products_modal.toast.no_products_imported');

                toast({
                    title: t('import_products_modal.toast.import_completed'),
                    description,
                    type: data.errors?.length ? 'warning' : 'success',
                });
            } else {
                setError((response.data.message || t('import_products_modal.errors.import_failed')) + '\n' + t('product_import_flow.uncertain'));
                setCurrentStep('preview');
            }
        } catch (err: unknown) {
            if (!mounted.current) return;
            setError(
                ((err as { response?: { data?: { message?: string } } }).response
                    ?.data?.message || t('import_products_modal.errors.import_failed')) + '\n' + t('product_import_flow.uncertain'),
            );
            setCurrentStep('preview');
        } finally {
            pendingRequest.current = null;
            if (mounted.current) setIsImporting(false);
        }
    };

    // Reset modal state
    const handleClose = () => {
        if (pendingRequest.current === 'import') return;
        validationController.current?.abort();
        validationController.current = null;
        pendingRequest.current = null;
        // Pass results before clearing them
        onClose(importResults ?? (importAttempted.current ? { requiresRefresh: true } : undefined));
        importAttempted.current = false;
        
        setSelectedFile(null);
        setImportedProducts([]);
        setValidationSummary(null);
        setImportResults(null);
        setImportProgress(null);
        setError(null);
        setCurrentStep('upload');
        setShowValidOnly(false);
        setShowInvalidOnly(false);
        setPreviewPage(1);
        setIsValidating(false);
    };

    // Filter products based on view options
    const filteredProducts = useMemo(() => importedProducts.filter((product) => {
        if (showValidOnly && !product.isValid) return false;
        if (showInvalidOnly && product.isValid) return false;
        return true;
    }), [importedProducts, showValidOnly, showInvalidOnly]);
    const previewPageCount = Math.max(1, Math.ceil(filteredProducts.length / 25));
    const visibleProducts = filteredProducts.slice((previewPage - 1) * 25, previewPage * 25);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col [&>button]:hidden border-cyan-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-cyan-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: '50rem',
                    width: 'calc(100% - 2rem)',
                }}
                hideClose
            >
                <DialogHeader className="border-b border-cyan-200 pb-4 dark:border-cyan-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-cyan-800 dark:text-cyan-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
                            <Upload className="h-4 w-4 text-white" />
                        </div>
                        {t('import_products_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6">
                {error && (
                    <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
                            <span className="font-medium dark:text-red-300">
                                {t('import_products_modal.errors.import_error')}
                            </span>
                        </div>
                        <div className="whitespace-pre-line text-red-700 dark:text-red-300">
                            {error}
                        </div>
                        {error.includes(t('import_products_modal.errors.missing_column_prefix')) && (
                            <div className="mt-3 rounded-lg border border-cyan-300 bg-cyan-50 p-4 text-xs text-cyan-900 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-100">
                                <div className="mb-2 font-medium text-cyan-800 dark:text-cyan-200">
                                    {t('import_products_modal.format.required_format')}
                                </div>
                                <div className="rounded border border-cyan-300 bg-cyan-100 p-3 font-mono dark:border-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-100">
                                    {t('import_products_modal.format.csv_header')}
                                </div>
                                <div className="mt-3 font-medium text-cyan-800 dark:text-cyan-200">
                                    {t('import_products_modal.format.make_sure_headers')}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 1: File Upload */}
                {currentStep === 'upload' && (
                    <div className="space-y-6">
                        {/* File Upload Area */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    {t('import_products_modal.file_section.csv_file')}
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const csvContent = `name,category,supplier,barcode,secondary_barcode,cost_price,sell_price,stock,min_stock,per_carton
"Product A","Electronics","Supplier A","1234567890123","1234567890123-ALT",10.00,15.00,100,10,12
"Product B","Clothing","Supplier B","1234567890124","",5.00,8.00,50,5,
"Product C","Books","Supplier C","1234567890125","1234567890125-ALT",3.00,5.00,200,20,24`;

                                        const blob = new Blob([csvContent], {
                                            type: 'text/csv;charset=utf-8;',
                                        });
                                        const link =
                                            document.createElement('a');
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute('href', url);
                                        link.setAttribute(
                                            'download',
                                            'product_import_template.csv',
                                        );
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="text-xs"
                                >
                                    <Download className="mr-1 h-3 w-3" />
                                    {t('import_products_modal.file_section.download_template')}
                                </Button>
                            </div>

                            <div
                                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                    dragActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    disabled={isValidating || isImporting}
                                    onChange={(e) =>
                                        e.target.files?.[0] &&
                                        handleFileSelect(e.target.files[0])
                                    }
                                    className="hidden"
                                    tabIndex={-1}
                                />

                                {selectedFile ? (
                                    <div className="space-y-2">
                                        <FileText className="mx-auto h-8 w-8 text-green-600" />
                                        <p className="text-sm font-medium">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(
                                                selectedFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{' '}
                                            {t('import_products_modal.file_section.mb')}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            {t('import_products_modal.file_section.choose_different_file')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm">
                                            {t('import_products_modal.file_section.drag_and_drop')}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            {t('import_products_modal.file_section.choose_file')}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            {t('import_products_modal.file_section.supports_csv')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Import Options */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">
                                {t('import_products_modal.import_options.title')}
                            </Label>

                            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            {t('import_products_modal.import_options.update_existing')}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('import_products_modal.import_options.update_existing_desc')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={updateExisting}
                                        disabled={isValidating || isImporting}
                                        onCheckedChange={setUpdateExisting}
                                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 focus:ring-cyan-200 dark:data-[state=checked]:bg-cyan-600 dark:data-[state=checked]:border-cyan-600 dark:focus:ring-cyan-400"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            {t('import_products_modal.import_options.skip_duplicates')}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('import_products_modal.import_options.skip_duplicates_desc')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={skipDuplicates}
                                        disabled={isValidating || isImporting}
                                        onCheckedChange={setSkipDuplicates}
                                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 focus:ring-cyan-200 dark:data-[state=checked]:bg-cyan-600 dark:data-[state=checked]:border-cyan-600 dark:focus:ring-cyan-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CSV Format Info */}
                        <div className="rounded-lg border border-cyan-300 bg-cyan-50 p-4 dark:border-cyan-600 dark:bg-cyan-900/20">
                            <h4 className="mb-2 text-sm font-medium text-cyan-800 dark:text-cyan-200">
                                {t('import_products_modal.format.required_format')}
                            </h4>
                            <code className="block rounded border border-cyan-300 bg-cyan-100 p-2 text-xs text-cyan-900 dark:border-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-100">
                                name,category,supplier,barcode,secondary_barcode,cost_price,sell_price,stock,min_stock,per_carton
                            </code>
                            <ul className="mt-2 space-y-1 text-xs text-cyan-900 dark:text-cyan-100">
                                <li>
                                    • <strong>{t('import_products_modal.format.name')}</strong> {t('import_products_modal.format.name_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.category')}</strong> {t('import_products_modal.format.category_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.supplier')}</strong> {t('import_products_modal.format.supplier_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.barcode')}</strong> {t('import_products_modal.format.barcode_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.cost_price')}</strong> {t('import_products_modal.format.cost_price_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.sell_price')}</strong> {t('import_products_modal.format.sell_price_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.stock')}</strong> {t('import_products_modal.format.stock_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.min_stock')}</strong> {t('import_products_modal.format.min_stock_desc')}
                                </li>
                                <li>
                                    • <strong>{t('import_products_modal.format.per_carton')}</strong> {t('import_products_modal.format.per_carton_desc')}
                                </li>
                                <li>
                                    • <strong>secondary_barcode</strong> (Optional) Alternative barcode for the product
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Step 2: Validation Results */}
                {currentStep === 'preview' && validationSummary && (
                    <div className="flex h-96 flex-col space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            <div className="rounded-lg border border-cyan-300 bg-cyan-50 p-3 dark:border-cyan-600 dark:bg-cyan-900/20">
                                <div className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">
                                    {validationSummary.totalRows}
                                </div>
                                <div className="text-xs text-cyan-700 dark:text-cyan-300">
                                    {t('import_products_modal.validation.total_rows')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {validationSummary.validRows}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                    {t('import_products_modal.validation.valid_rows')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {validationSummary.invalidRows}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400">
                                    {t('import_products_modal.validation.invalid_rows')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 dark:border-blue-600 dark:bg-blue-900/20">
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {validationSummary.createCount}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {t('import_products_modal.validation.will_create')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {validationSummary.updateCount}
                                </div>
                                <div className="text-xs text-purple-600 dark:text-purple-400">
                                    {t('import_products_modal.validation.will_update')}
                                </div>
                            </div>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant={showValidOnly ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setShowValidOnly(!showValidOnly);
                                    setPreviewPage(1);
                                    setShowInvalidOnly(false);
                                }}
                            >
                                <Eye className="mr-1 h-3 w-3" />
                                {`${t('import_products_modal.filters.valid_only_text')} (${validationSummary.validRows})`}
                            </Button>
                            <Button
                                variant={
                                    showInvalidOnly ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                    setShowInvalidOnly(!showInvalidOnly);
                                    setPreviewPage(1);
                                    setShowValidOnly(false);
                                }}
                            >
                                <EyeOff className="mr-1 h-3 w-3" />
                                {`${t('import_products_modal.filters.invalid_only_text')} (${validationSummary.invalidRows})`}
                            </Button>
                            {(showValidOnly || showInvalidOnly) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowValidOnly(false);
                                        setShowInvalidOnly(false);
                                        setPreviewPage(1);
                                    }}
                                >
                                    {t('import_products_modal.filters.show_all')}
                                </Button>
                            )}
                        </div>

                        {/* Products List */}
                        <div className="flex items-center justify-between gap-2">
                            <Button variant="outline" size="sm" disabled={previewPage <= 1} onClick={() => setPreviewPage(page => page - 1)}>{t('product_import_flow.previous')}</Button>
                            <span role="status" className="text-sm">{t('product_import_flow.page', { page: previewPage, total: previewPageCount, rows: filteredProducts.length })}</span>
                            <Button variant="outline" size="sm" disabled={previewPage >= previewPageCount} onClick={() => setPreviewPage(page => page + 1)}>{t('product_import_flow.next')}</Button>
                        </div>
                        <div className="max-h-96 flex-1 overflow-auto rounded-md border dark:border-gray-700">
                            <div className="space-y-2 p-2">
                                {visibleProducts.map((product) => (
                                    <div
                                        key={product.rowNumber}
                                        className={`rounded-lg border p-3 ${
                                            product.isValid
                                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                                                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {product.isValid ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    )}
                                                    <span className="text-sm font-medium dark:text-gray-200">
                                                        {product.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            product.action ===
                                                            'create'
                                                                ? 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                                                                : product.action ===
                                                                    'update'
                                                                  ? 'border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300'
                                                                  : 'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                                                        }
                                                    >
                                                        {product.action ===
                                                        'create'
                                                            ? t('import_products_modal.validation.create')
                                                            : product.action ===
                                                                'update'
                                                              ? t('import_products_modal.validation.update')
                                                              : t('import_products_modal.validation.skip')}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {t('import_products_modal.product_labels.category')}{' '}
                                                        {product.category}
                                                    </span>
                                                    <span>
                                                        {t('import_products_modal.product_labels.supplier')}{' '}
                                                        {product.supplier}
                                                    </span>
                                                    <span>
                                                        {t('import_products_modal.product_labels.barcode')}{' '}
                                                        {product.barcode}
                                                    </span>
                                                    <span>
                                                        Secondary Barcode: {product.secondary_barcode || '-'}
                                                    </span>
                                                    <span>
                                                        {t('import_products_modal.product_labels.stock')} {product.stock}
                                                    </span>
                                                    <span>
                                                        {t('import_products_modal.product_labels.cost')}{' '}
                                                        {formatCurrency(
                                                            product.cost_price,
                                                        )}
                                                    </span>
                                                    <span>
                                                        {t('import_products_modal.product_labels.sell')}{' '}
                                                        {formatCurrency(
                                                            product.sell_price,
                                                        )}
                                                    </span>
                                                    <span>
                                                        {t('import_products_modal.product_labels.per_carton')}{' '}
                                                        {product.per_carton || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {`${t('import_products_modal.product_labels.row_text')} ${product.rowNumber}`}
                                            </span>
                                        </div>

                                        {/* Errors */}
                                        {product.errors &&
                                            product.errors.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {product.errors.map(
                                                        (error, errorIndex) => (
                                                            <div
                                                                key={errorIndex}
                                                                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
                                                            >
                                                                <AlertCircle className="h-3 w-3" />
                                                                {error}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Importing */}
                {currentStep === 'importing' && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                        <h3 className="text-lg font-medium">
                            {t('import_products_modal.importing.title')}
                        </h3>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('import_products_modal.importing.please_wait')}
                            <br />
                            {t('import_products_modal.importing.may_take_moments')}
                        </p>
                        {importProgress && (
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{t(importProgress.percentage >= 100 ? 'product_import_flow.processing' : 'product_import_flow.uploading')}</span>
                                    <span>{importProgress.percentage < 100 ? `${importProgress.percentage}%` : '…'}</span>
                                </div>
                                <Progress value={importProgress.percentage} />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Complete */}
                {currentStep === 'complete' && importResults && (
                    <div className="space-y-6 py-8">
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                            <h3 className="text-lg font-medium text-green-700">
                                {t('import_products_modal.results.title')}
                            </h3>
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:border dark:border-gray-700 dark:bg-gray-800/50">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {t('import_products_modal.results.import_results')}
                            </h4>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {t('import_products_modal.results.total_rows')}
                                        </span>
                                        <span className="font-medium dark:text-gray-200">
                                            {importResults.total_processed ||
                                                validationSummary?.totalRows ||
                                                0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {t('import_products_modal.results.validation_passed')}
                                        </span>
                                        <span className="font-medium dark:text-gray-200">
                                            {validationSummary?.validRows || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {t('import_products_modal.results.successfully_imported')}
                                        </span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                            {(importResults.created || 0) +
                                                (importResults.updated || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-green-600 dark:text-green-400">
                                            {t('import_products_modal.results.created')}
                                        </span>
                                        <span className="font-medium dark:text-gray-200">
                                            {importResults.created || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-cyan-600 dark:text-cyan-400">
                                            {t('import_products_modal.results.updated')}
                                        </span>
                                        <span className="font-medium dark:text-gray-200">
                                            {importResults.updated || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {t('import_products_modal.results.skipped')}
                                        </span>
                                        <span className="font-medium dark:text-gray-200">
                                            {importResults.skipped || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {t('import_products_modal.results.success_rate')}
                                    </span>
                                    <span className="font-medium dark:text-gray-200">
                                        {Math.round(
                                            (((importResults.created || 0) +
                                                (importResults.updated || 0)) /
                                                (importResults.total_processed ||
                                                    1)) *
                                                100,
                                        )}
                                        %
                                    </span>
                                </div>
                            </div>

                            {/* Errors Section */}
                            {importResults.errors &&
                                importResults.errors.length > 0 && (
                                    <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                        <h5 className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                                            {`${t('import_products_modal.results.errors_text')} (${importResults.errors.length})`}
                                        </h5>
                                        <div className="max-h-40 space-y-1 overflow-y-auto">
                                            {importResults.errors
                                                .slice(0, 10)
                                                .map((error, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400"
                                                    >
                                                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                                        <span>{error}</span>
                                                    </div>
                                                ))}
                                            {importResults.errors.length >
                                                10 && (
                                                <div className="text-xs text-gray-500 italic dark:text-gray-400">
                                                    {`... and ${importResults.errors.length - 10} ${t('import_products_modal.results.more_errors_text')}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            {t('import_products_modal.results.click_close_refresh')}
                        </p>
                    </div>
                )}
                </div>

                <DialogFooter className="border-t border-cyan-200 pt-4 dark:border-cyan-800">
                    {currentStep === 'upload' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 hover:text-cyan-800 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-200 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={handleValidateFile}
                                disabled={!selectedFile || isValidating}
                                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:ring-2 focus:ring-cyan-200 focus:outline-none disabled:opacity-50 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:to-cyan-800 dark:focus:ring-2 dark:focus:ring-cyan-400"
                            >
                                {isValidating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        {t('import_products_modal.buttons.validating')}
                                    </>
                                ) : (
                                    t('import_products_modal.buttons.validate_file')
                                )}
                            </Button>
                        </>
                    )}

                    {currentStep === 'preview' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep('upload')}
                                className="border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 hover:text-cyan-800 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 focus:outline-none dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-200 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400"
                            >
                                {t('import_products_modal.buttons.back_to_upload')}
                            </Button>
                            <Button
                                onClick={handleImportProducts}
                                disabled={
                                    !validationSummary ||
                                    validationSummary.validRows === 0 ||
                                    importAttempted.current ||
                                    isImporting
                                }
                                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:ring-2 focus:ring-cyan-200 focus:outline-none disabled:opacity-50 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:to-cyan-800 dark:focus:ring-2 dark:focus:ring-cyan-400"
                            >
                                {`${t('import_products_modal.buttons.import_products_text')} ${validationSummary?.validRows || 0}`}
                            </Button>
                        </>
                    )}

                    {(currentStep === 'importing' ||
                        currentStep === 'complete') && (
                        <Button
                            variant="outline"
                            onClick={() => handleClose()}
                            disabled={currentStep === 'importing'}
                            className="border-cyan-300 bg-cyan-50 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-100 hover:text-cyan-800 focus:border-cyan-500 focus:bg-cyan-100 focus:ring-2 focus:ring-cyan-200 focus:outline-none disabled:opacity-50 dark:border-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-200 dark:focus:border-cyan-500 dark:focus:bg-cyan-900/30 dark:focus:ring-2 dark:focus:ring-cyan-400"
                        >
                            {currentStep === 'complete'
                                ? t('import_products_modal.buttons.close_refresh')
                                : t('import_products_modal.buttons.close')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
