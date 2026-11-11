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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
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
import { useRef, useState } from 'react';

interface ImportedSupplier {
    rowNumber: number;
    name: string;
    phone: string;
    email: string;
    supplier_code: string;
    business_name: string;
    business_address: string;
    business_phone: string;
    business_email: string;
    billing_contact_name: string;
    billing_contact_phone: string;
    billing_contact_email: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    action: 'create' | 'update' | 'skip';
}

interface ValidationSummary {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateNames: number;
    duplicateCodes: number;
    createCount: number;
    updateCount: number;
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
    statistics?: {
        created: number;
        updated: number;
        skipped: number;
        total_rows?: number;
        validation_passed?: number;
        actual_imports?: number;
        unexpected_failures?: number;
        success_rate?: number;
    };
}

interface ImportSuppliersModalProps {
    isOpen: boolean;
    onClose: (importedData?: unknown[]) => void;
}

export function ImportSuppliersModal({
    isOpen,
    onClose,
}: ImportSuppliersModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    // File handling states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Import options
    const [updateExisting, setUpdateExisting] = useState(false);
    const [skipDuplicates, setSkipDuplicates] = useState(true);

    // Processing states
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Data states
    const [importedSuppliers, setImportedSuppliers] = useState<
        ImportedSupplier[]
    >([]);
    const [validationSummary, setValidationSummary] =
        useState<ValidationSummary | null>(null);
    const [importResults, setImportResults] = useState<ImportResults | null>(
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
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError(t('import_suppliers_modal.validation.file_required'));
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            setError(t('import_suppliers_modal.file_too_large'));
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

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    // Validate CSV file
    const handleValidateFile = async () => {
        if (!selectedFile) {
            setError(t('import_suppliers_modal.validation.file_required'));
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('update_existing', updateExisting ? '1' : '0');
            formData.append('skip_duplicates', skipDuplicates ? '1' : '0');

            const response = await axios.post(
                '/api/suppliers/import/validate',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            const result = response.data;

            if (!result.success) {
                setError(result.message || t('import_suppliers_modal.error_messages.import_failed'));
                return;
            }

            setImportedSuppliers(result.data.suppliers);
            setValidationSummary(result.data.summary);
            setCurrentStep('preview');
        } catch (error: unknown) {
            const errorData = axios.isAxiosError(error)
                ? error.response?.data
                : null;
            console.error('Validation error:', errorData);

            // Handle validation errors with detailed feedback
            if (
                errorData &&
                typeof errorData === 'object' &&
                'errors' in errorData
            ) {
                const errors = errorData.errors as Record<string, string[]>;
                const errorMessages: string[] = [];
                Object.entries(errors).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        errorMessages.push(`${field}: ${messages.join(', ')}`);
                    }
                });
                const message =
                    (errorData as { message?: string }).message ||
                    t('import_suppliers_modal.error_messages.import_failed');
                setError(
                    message +
                        (errorMessages.length > 0
                            ? '\n\nDetails:\n' + errorMessages.join('\n')
                            : ''),
                );
            } else {
                const message =
                    errorData &&
                    typeof errorData === 'object' &&
                    'message' in errorData
                        ? (errorData.message as string)
                        : error instanceof Error
                          ? error.message
                          : t('import_suppliers_modal.error_messages.file_upload_failed');
                setError(message);
            }
        } finally {
            setIsValidating(false);
        }
    };

    // Import suppliers
    const handleImport = async () => {
        if (!selectedFile || !validationSummary) {
            return;
        }

        setIsImporting(true);
        setCurrentStep('importing');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('update_existing', updateExisting ? '1' : '0');
            formData.append('skip_duplicates', skipDuplicates ? '1' : '0');

            const response = await axios.post(
                '/api/suppliers/import/process',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            const result = response.data;

            if (!result.success) {
                const errorMessage = result.message || t('import_suppliers_modal.error_messages.import_failed');
                toast({
                    title: t('import_suppliers_modal.error_messages.import_failed'),
                    description: errorMessage,
                    type: 'error',
                });
                setError(errorMessage);
                setCurrentStep('preview');
                return;
            }

            // Show success toast
            const importedCount = result.data?.imported_count || 0;
            const updatedCount = result.data?.updated_count || 0;
            const skippedCount = result.data?.skipped_count || 0;

            toast({
                title: t('import_suppliers_modal.success_messages.import_successful'),
                description: `Imported ${importedCount} suppliers, updated ${updatedCount}, skipped ${skippedCount}`,
                type: 'success',
                duration: 5000,
            });

            setImportResults(result.data);
            setCurrentStep('complete');
        } catch (error: unknown) {
            const errorData = axios.isAxiosError(error)
                ? error.response?.data
                : null;
            console.error('Import error:', errorData);
            const errorMessage =
                errorData &&
                typeof errorData === 'object' &&
                'message' in errorData
                    ? (errorData.message as string)
                    : error instanceof Error
                      ? error.message
                      : t('import_suppliers_modal.error_messages.import_failed');
            toast({
                title: t('import_suppliers_modal.error_messages.import_failed'),
                description: errorMessage,
                type: 'error',
            });
            setError(errorMessage);
            setCurrentStep('preview');
        } finally {
            setIsImporting(false);
        }
    };

    // Reset modal
    const handleClose = () => {
        setSelectedFile(null);
        setImportedSuppliers([]);
        setValidationSummary(null);
        setError(null);
        setCurrentStep('upload');
        setShowValidOnly(false);
        setShowInvalidOnly(false);
        setUpdateExisting(false);
        setSkipDuplicates(true);
        onClose();
    };

    // Download CSV template
    const downloadTemplate = () => {
        const csvContent = `name,phone,email,supplier_code
"Supplier A","+1234567890","contact@suppliera.com","SUP001"
"Supplier B","+1987654321","contact@supplierb.com",""
"Supplier C","+1122334455","contact@supplierc.com","SUP003"`;

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'supplier_import_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter suppliers for display
    const filteredSuppliers = importedSuppliers.filter((supplier) => {
        if (showValidOnly && !supplier.isValid) return false;
        if (showInvalidOnly && supplier.isValid) return false;
        return true;
    });

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden border-pink-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-pink-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)] [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                }}
            >
                <DialogHeader className="border-b border-pink-200 pb-4 dark:border-pink-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-pink-800 dark:text-pink-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg">
                            <Upload className="h-4 w-4 text-white" />
                        </div>
                        {t('import_suppliers_modal.title')}
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
                            <span className="font-medium dark:text-red-300">
                                {t('import_suppliers_modal.error_messages.import_failed')}
                            </span>
                        </div>
                        <div className="whitespace-pre-line text-red-700 dark:text-red-300">
                            {error}
                        </div>
                        {error.includes('Missing required column') && (
                            <div className="mt-3 rounded-lg border border-[#1F3F3F]/30 bg-[#1F3F3F]/20 p-4 text-xs text-[#1F3F3F] dark:border-[#1F3F3F]/20 dark:bg-[#1F3F3F]/10 dark:text-[#1F3F3F]">
                                    <div className="mb-2 font-medium text-[#1F3F3F] dark:text-[#1F3F3F]">
                                    {t('import_suppliers_modal.csv_format.title')}
                                </div>
                                    <div className="rounded border bg-[#1F3F3F]/10 p-3 font-mono dark:border-[#1F3F3F]/30 dark:bg-[#1F3F3F]/20 dark:text-[#1F3F3F]">
                                    {t('import_suppliers_modal.csv_format.example')}
                                </div>
                                <div className="mt-3 font-medium text-[#1F3F3F] dark:text-[#1F3F3F]">
                                    {t('import_suppliers_modal.csv_format.note')}
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
                                    CSV File
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTemplate}
                                    className="text-xs"
                                >
                                    <Download className="mr-1 h-3 w-3" />
                                    {t('import_suppliers_modal.buttons.download_template')}
                                </Button>
                            </div>

                            <div
                                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                    dragActive
                                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20'
                                        : 'border-border hover:border-pink-400'
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
                                    onChange={handleFileInputChange}
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
                                                    {(selectedFile.size / 1024).toFixed(
                                                        1,
                                                    )}{' '}
                                                    KB
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                >
                                                    {t('import_suppliers_modal.choose_different_file')}
                                                </Button>
                                            </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm">
                                            {t('import_suppliers_modal.drag_drop_hint')}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            {t('import_suppliers_modal.choose_file')}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            {t('import_suppliers_modal.supports_csv')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Import Options */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">
                                {t('import_suppliers_modal.import_options_title')}
                            </Label>

                            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            {t('import_suppliers_modal.update_existing_label')}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('import_suppliers_modal.update_existing_desc')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={updateExisting}
                                        onCheckedChange={setUpdateExisting}
                                        className={
                                            updateExisting
                                                ? '!bg-gradient-to-r !from-pink-500 !to-pink-600 hover:!from-pink-600 hover:!to-pink-700'
                                                : ''
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            {t('import_suppliers_modal.skip_duplicates')}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('import_suppliers_modal.skip_duplicates_csv_desc')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={skipDuplicates}
                                        onCheckedChange={setSkipDuplicates}
                                        className={
                                            skipDuplicates
                                                ? '!bg-gradient-to-r !from-pink-500 !to-pink-600 hover:!from-pink-600 hover:!to-pink-700'
                                                : ''
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CSV Format Info */}
                        <div className="rounded-lg border border-pink-300 bg-pink-50 p-4 dark:border-pink-600 dark:bg-pink-900/20">
                            <h4 className="mb-2 text-sm font-medium text-pink-800 dark:text-pink-200">
                                {t('import_suppliers_modal.csv_format.title')}
                            </h4>
                            <code className="block rounded bg-pink-100 p-2 text-xs text-pink-800 dark:bg-pink-900/30 dark:text-pink-200">
                                {t('import_suppliers_modal.csv_format.example')}
                            </code>
                            <ul className="mt-2 space-y-1 text-xs text-pink-700 dark:text-pink-300">
                                <li>
                                    • <strong>{t('import_suppliers_modal.csv_format.fields.name.label')}</strong>{' '}
                                    {t('import_suppliers_modal.csv_format.fields.name.description')}
                                </li>
                                <li>
                                    • <strong>{t('import_suppliers_modal.csv_format.fields.phone.label')}</strong>{' '}
                                    {t('import_suppliers_modal.csv_format.fields.phone.description')}
                                </li>
                                <li>
                                    • <strong>{t('import_suppliers_modal.csv_format.fields.email.label')}</strong>{' '}
                                    {t('import_suppliers_modal.csv_format.fields.email.description')}
                                </li>
                                <li>
                                    • <strong>{t('import_suppliers_modal.csv_format.fields.supplier_code.label')}</strong>{' '}
                                    {t('import_suppliers_modal.csv_format.fields.supplier_code.description')}
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
                            <div className="rounded-lg border border-pink-300 bg-pink-50 p-3 dark:border-pink-600 dark:bg-pink-900/20">
                                <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                                    {validationSummary.totalRows}
                                </div>
                                <div className="text-xs text-pink-600 dark:text-pink-400">
                                    {t('import_suppliers_modal.summary.total_rows')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {validationSummary.validRows}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                    {t('import_suppliers_modal.summary.valid_rows')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {validationSummary.invalidRows}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400">
                                    {t('import_suppliers_modal.summary.invalid_rows')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 dark:border-blue-600 dark:bg-blue-900/20">
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {validationSummary.createCount || 0}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {t('import_suppliers_modal.summary.will_create')}
                                </div>
                            </div>
                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {validationSummary.updateCount || 0}
                                </div>
                                <div className="text-xs text-purple-600 dark:text-purple-400">
                                    {t('import_suppliers_modal.summary.will_update')}
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
                                    setShowInvalidOnly(false);
                                }}
                                className={
                                    showValidOnly
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700'
                                        : ''
                                }
                            >
                                <Eye className="mr-1 h-3 w-3" />
                                {t('import_suppliers_modal.buttons.valid_only', { count: validationSummary.validRows })}
                            </Button>
                            <Button
                                variant={
                                    showInvalidOnly ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                    setShowInvalidOnly(!showInvalidOnly);
                                    setShowValidOnly(false);
                                }}
                                className={
                                    showInvalidOnly
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700'
                                        : ''
                                }
                            >
                                <EyeOff className="mr-1 h-3 w-3" />
                                {t('import_suppliers_modal.buttons.invalid_only', { count: validationSummary.invalidRows })}
                            </Button>
                            {(showValidOnly || showInvalidOnly) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowValidOnly(false);
                                        setShowInvalidOnly(false);
                                    }}
                                >
                                    {t('import_suppliers_modal.buttons.show_all')}
                                </Button>
                            )}
                        </div>

                        {/* Suppliers List */}
                        <div className="max-h-96 flex-1 overflow-auto rounded-md border dark:border-[#4A6CF7]/30">
                            <div className="space-y-2 p-2">
                                {filteredSuppliers.map((supplier, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-lg border p-3 ${
                                            supplier.isValid
                                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                                                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {supplier.isValid ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {supplier.name}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            supplier.action ===
                                                            'create'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {supplier.action === 'create'
                                                            ? t('import_suppliers_modal.preview.actions.create')
                                                            : supplier.action === 'update'
                                                            ? t('import_suppliers_modal.preview.actions.update')
                                                            : t('import_suppliers_modal.preview.actions.skip')}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {t('import_suppliers_modal.preview.field_labels.code')} {' '}
                                                        {supplier.supplier_code}
                                                    </span>
                                                    <span>
                                                        {t('import_suppliers_modal.preview.field_labels.phone')} {' '}
                                                        {supplier.phone || t('import_suppliers_modal.preview.field_labels.na')}
                                                    </span>
                                                    <span>
                                                        {t('import_suppliers_modal.preview.field_labels.email')} {' '}
                                                        {supplier.email || t('import_suppliers_modal.preview.field_labels.na')}
                                                    </span>
                                                    <span>
                                                        {t('import_suppliers_modal.preview.field_labels.business')} {' '}
                                                        {supplier.business_name || t('import_suppliers_modal.preview.field_labels.na')}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {t('import_suppliers_modal.preview.field_labels.row')} {supplier.rowNumber}
                                            </span>
                                        </div>

                                        {/* Errors */}
                                        {supplier.errors &&
                                            supplier.errors.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {supplier.errors.map(
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

                                        {/* Warnings */}
                                        {supplier.warnings &&
                                            supplier.warnings.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {supplier.warnings.map(
                                                        (
                                                            warning,
                                                            warningIndex,
                                                        ) => (
                                                            <div
                                                                key={
                                                                    warningIndex
                                                                }
                                                                className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"
                                                            >
                                                                <AlertCircle className="h-3 w-3" />
                                                                {warning}
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
                        <RefreshCw className="h-12 w-12 animate-spin text-pink-600 dark:text-pink-400" />
                        <h3 className="text-lg font-medium">
                            {t('import_suppliers_modal.importing')}
                        </h3>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('import_suppliers_modal.importing_desc')}
                        </p>
                    </div>
                )}

                {/* Step 4: Complete */}
                {currentStep === 'complete' && importResults && (
                    <div className="space-y-6 py-8">
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                            <h3 className="text-lg font-medium text-green-700">
                                {t('import_suppliers_modal.complete.title')}
                            </h3>
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-3 rounded-lg bg-[#4A6CF7]/5 p-4 dark:border dark:border-[#4A6CF7]/30 dark:bg-[#4A6CF7]/10">
                            <h4 className="font-medium text-[#4A6CF7]/90 dark:text-[#4A6CF7]/70">
                                {t('import_suppliers_modal.complete.results_title')}
                            </h4>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-[#4A6CF7]/70 dark:text-[#4A6CF7]/50">
                                            {t('import_suppliers_modal.complete.total_rows')}
                                        </span>
                                        <span className="font-medium dark:text-[#4A6CF7]/80">
                                            {importResults.statistics
                                                ?.total_rows ||
                                                validationSummary?.totalRows ||
                                                0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#4A6CF7]/70 dark:text-[#4A6CF7]/50">
                                            {t('import_suppliers_modal.complete.validation_passed')}
                                        </span>
                                        <span className="font-medium dark:text-[#4A6CF7]/80">
                                            {importResults.statistics
                                                ?.validation_passed ||
                                                validationSummary?.validRows ||
                                                0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#4A6CF7]/70 dark:text-[#4A6CF7]/50">
                                            {t('import_suppliers_modal.complete.successfully_imported')}
                                        </span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                            {importResults.statistics
                                                ?.actual_imports ||
                                                (importResults.created || 0) +
                                                    (importResults.updated ||
                                                        0) ||
                                                0}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-green-600 dark:text-green-400">
                                            {t('import_suppliers_modal.complete.created_label')}
                                        </span>
                                        <span className="font-medium dark:text-[#4A6CF7]/80">
                                            {importResults.created || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#1F3F3F] dark:text-[#1F3F3F]">
                                            {t('import_suppliers_modal.complete.updated_label')}
                                        </span>
                                        <span className="font-medium dark:text-[#4A6CF7]/80">
                                            {importResults.updated || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#4A6CF7]/70 dark:text-[#4A6CF7]/50">
                                            {t('import_suppliers_modal.complete.skipped_label')}
                                        </span>
                                        <span className="font-medium dark:text-[#4A6CF7]/80">
                                            {importResults.skipped || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning for discrepancies */}
                            {(importResults.statistics?.unexpected_failures ||
                                0) > 0 && (
                                <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        <span className="text-sm font-medium text-yellow-800">
                                            Warning:{' '}
                                            {importResults.statistics
                                                ?.unexpected_failures || 0}{' '}
                                            suppliers failed during import
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-yellow-700">
                                        These suppliers passed validation but
                                        failed to import. Check logs for
                                        details.
                                    </p>
                                </div>
                            )}

                            {/* Success Rate */}
                            <div className="border-t border-[#4A6CF7]/20 pt-2">
                                <div className="flex justify-between text-sm">
                                        <span className="text-[#4A6CF7]/70">
                                        {t('import_suppliers_modal.complete.success_rate')}
                                    </span>
                                    <span className="font-medium">
                                        {importResults.statistics
                                            ?.success_rate || 100}
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            {t('import_components.close_to_refresh')}
                        </p>
                    </div>
                )}

                <DialogFooter className="border-t border-pink-200 pt-4 dark:border-pink-800">
                    {currentStep === 'upload' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                {t("common.cancel")}
                            </Button>
                            <Button
                                onClick={handleValidateFile}
                                disabled={!selectedFile || isValidating}
                                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
                            >
                                {isValidating ? (
                                    <>
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            {t('import_suppliers_modal.validating')}
                                    </>
                                ) : (
                                    t('import_suppliers_modal.buttons.start_import')
                                )}
                            </Button>
                        </>
                    )}

                    {currentStep === 'preview' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep('upload')}
                            >
                                {t('import_products_modal.buttons.back_to_upload')}
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={
                                    !validationSummary ||
                                    validationSummary.validRows === 0 ||
                                    isImporting
                                }
                                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700"
                            >
                                {t('import_products_modal.buttons.import_suppliers', { count: validationSummary?.validRows || 0 })}
                            </Button>
                        </>
                    )}

                    {(currentStep === 'importing' ||
                        currentStep === 'complete') && (
                        <Button
                            variant="outline"
                            onClick={() => handleClose()}
                            disabled={currentStep === 'importing'}
                        >
                            {currentStep === 'complete'
                                ? t('import_suppliers_modal.buttons.close_refresh')
                                : t('import_suppliers_modal.buttons.close')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
