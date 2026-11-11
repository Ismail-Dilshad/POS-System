import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsProvider, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { backupService, type BackupFile } from '@/services/core/backupService';
import { transactionService } from '@/services/business/transactionService';
import { purchaseService } from '@/services/business/purchaseService';
import { returnService } from '@/services/business/returnService';
import { expenseService } from '@/services/business/expenseService';
import axios from '@/bootstrap';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Database,
    Download,
    Loader2,
    RefreshCw,
    Save,
    X,
    Trash2,
    ShoppingCart,
    RotateCcw,
    Package,
    CreditCard,
    DollarSign,
    Eye,
    EyeOff,
    Key,
    Copy,
    Check,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DeleteAllCard } from '@/components/settings/delete-all-card';

// Deletion password constant (hidden by default)
const DELETION_PASSWORD = 'Esma3ilDilshadAmeenHasan04xade.@';

export default function Settings() {
    const { t } = useTranslation();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('backup');

    // Password visibility state
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    // Backup state
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [backupError, setBackupError] = useState<string | null>(null);
    const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

    // Copy password to clipboard
    const handleCopyPassword = useCallback(() => {
        navigator.clipboard.writeText(DELETION_PASSWORD).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, []);



    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.settings'), href: '/admin/settings' },
    ];




    // Load backups
    const loadBackups = useCallback(async () => {
        setLoadingBackups(true);
        setBackupError(null);

        try {
            const response = await backupService.listBackups();
            if (response.success && response.data) {
                setBackups(response.data);
            } else {
                setBackupError(response.message || t('settings.error_messages.failed_to_load_backups'));
            }
        } catch (error) {
            setBackupError(
                error instanceof Error
                    ? error.message
                    : t('settings.error_messages.failed_to_load_backups'),
            );
        } finally {
            setLoadingBackups(false);
        }
    }, [t]);

    // Load backups on mount
    useEffect(() => {
        loadBackups();
    }, [loadBackups]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadBackups();
        } catch {
            // ignore — keep existing UI state
        } finally {
            setRefreshing(false);
        }
    }, [loadBackups]);

    // Create backup
    const createBackup = async () => {
        setCreatingBackup(true);
        setBackupError(null);
        setBackupSuccess(null);

        try {
            const response = await backupService.createBackup();
            if (response.success) {
                setBackupSuccess(t('settings.success_messages.backup_created'));
                loadBackups(); // Reload the backup list
            } else {
                setBackupError(response.message || t('settings.error_messages.failed_to_create_backup'));
            }
        } catch (error) {
            setBackupError(
                error instanceof Error
                    ? error.message
                    : t('settings.error_messages.failed_to_create_backup'),
            );
        } finally {
            setCreatingBackup(false);
        }
    };

    // Download backup
    const downloadBackup = async (filename: string) => {
        try {
            await backupService.downloadBackup(filename);
        } catch (error) {
            setBackupError(
                error instanceof Error
                    ? error.message
                    : t('settings.error_messages.failed_to_download_backup'),
            );
        }
    };

    // Delete backup
    const deleteBackup = async (filename: string) => {
        if (!confirm(t('settings.confirmations.delete_backup'))) {
            return;
        }

        try {
            const response = await backupService.deleteBackup(filename);
            if (response.success) {
                setBackupSuccess(t('settings.success_messages.backup_deleted'));
                loadBackups(); // Reload the backup list
            } else {
                setBackupError(response.message || t('settings.error_messages.failed_to_delete_backup'));
            }
        } catch (error) {
            setBackupError(
                error instanceof Error
                    ? error.message
                    : t('settings.error_messages.failed_to_delete_backup'),
            );
        }
    };

    const renderBackupSettings = () => (
        <div className="space-y-6">
            {/* Error and Success Messages */}
            {backupError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        {backupError}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBackupError(null)}
                        className="mt-2 h-6 text-red-600 hover:text-red-700"
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            {backupSuccess && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        {backupSuccess}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBackupSuccess(null)}
                        className="mt-2 h-6 text-green-600 hover:text-green-700"
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            {/* Manual Backup Creation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {t('settings.database_backup')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('settings.backup_description')}
                    </p>

                    <div className="flex gap-2">
                        <Button
                            onClick={createBackup}
                            disabled={creatingBackup}
                            className="bg-primary text-white hover:bg-blue-700"
                        >
                            {creatingBackup ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('settings.creating_backup')}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {t('settings.create_backup')}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={loadBackups}
                            disabled={loadingBackups}
                        >
                            {loadingBackups ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Existing Backups */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        {t('settings.available_backups')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingBackups ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">{t('settings.loading_backups')}</span>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>{t('settings.no_backups_found')}</p>
                            <p className="text-sm">
                                {t('settings.create_first_backup')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {backups.map((backup) => (
                                <div
                                    key={backup.filename}
                                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium">
                                                {backup.filename}
                                            </div>
                                            {backup.is_full_backup && (
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                                    Full Backup
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {backup.filesize_human} • {backup.created_at_human}
                                        </div>
                                        {backup.tables_count && backup.total_records && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {backup.tables_count} tables • {backup.total_records.toLocaleString()} records
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                downloadBackup(backup.filename)
                                            }
                                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                deleteBackup(backup.filename)
                                            }
                                            className="text-red-600 hover:border-red-300 hover:text-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.settings')} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('navigation.settings')}
                    description={t('settings.backup_description')}
                >
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="!border-purple-300 !bg-purple-50 !text-purple-700 hover:!border-purple-500 hover:!bg-purple-100 dark:!border-purple-600 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!border-purple-500 dark:hover:!bg-purple-900/30"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                            />
                            {refreshing
                                ? t('common.loading', { defaultValue: 'Loading…' })
                                : t('common.refresh', { defaultValue: 'Refresh' })}
                        </Button>
                    </div>
                </PageHeader>

                {/* Tabs */}
                <TabsProvider value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="backup">
                            <Database className="mr-2 h-4 w-4" />
                            {t('settings.database_backup')}
                        </TabsTrigger>
                        <TabsTrigger value="drop-tables">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('settings.drop_tables')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="backup" className="mt-6">
                        {renderBackupSettings()}
                    </TabsContent>

                    <TabsContent value="drop-tables" className="mt-6 space-y-6">
                        {/* Admin Password Card */}
                        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-amber-700 dark:text-amber-300">
                                        {t('settings.admin_deletion_password')}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t('settings.admin_deletion_password_description')}
                                </p>
                                
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <div className="flex items-center gap-2 rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 px-3 py-2">
                                            <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 select-all">
                                                {showPassword ? DELETION_PASSWORD : '••••••••••••••••••••••••••••••••'}
                                            </code>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="h-9 px-3 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                        title={showPassword ? t('settings.hide_password') : t('settings.show_password')}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </Button>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyPassword}
                                        className="h-9 px-3 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                        title={t('settings.copy_password')}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </Button>
                                </div>
                                
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    {t('settings.password_security_warning')}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Delete Transactions */}
                            <DeleteAllCard
                                title={t('settings.delete_all_transactions')}
                                description={t('settings.delete_all_transactions_description')}
                                confirmMessage={t('settings.confirm_delete_transactions')}
                                onDelete={async (password) => {
                                    const response = await transactionService.deleteAllTransactions(password);
                                    return {
                                        success: response.success,
                                        data: response.data,
                                        message: response.message,
                                    };
                                }}
                                successMessage={t('settings.transactions_deleted_success')}
                                successCountMessage={(count) => t('settings.transactions_deleted_count', { count })}
                                icon={<ShoppingCart className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            />

                            {/* Delete Purchases */}
                            <DeleteAllCard
                                title={t('settings.delete_all_purchases')}
                                description={t('settings.delete_all_purchases_description')}
                                confirmMessage={t('settings.confirm_delete_purchases')}
                                onDelete={async (password) => {
                                    const response = await purchaseService.deleteAllPurchases(password);
                                    return {
                                        success: response.success,
                                        data: response.data,
                                        message: response.message,
                                    };
                                }}
                                successMessage={t('settings.purchases_deleted_success')}
                                successCountMessage={(count) => t('settings.purchases_deleted_count', { count })}
                                icon={<Package className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            />

                            {/* Delete Returns */}
                            <DeleteAllCard
                                title={t('settings.delete_all_returns')}
                                description={t('settings.delete_all_returns_description')}
                                confirmMessage={t('settings.confirm_delete_returns')}
                                onDelete={async (password) => {
                                    const response = await returnService.deleteAllReturns(password);
                                    return {
                                        success: response.success,
                                        data: response.data,
                                        message: response.message,
                                    };
                                }}
                                successMessage={t('settings.returns_deleted_success')}
                                successCountMessage={(count) => t('settings.returns_deleted_count', { count })}
                                icon={<RotateCcw className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            />

                            {/* Delete Supplier Returns */}
                            <DeleteAllCard
                                title={t('settings.delete_all_supplier_returns')}
                                description={t('settings.delete_all_supplier_returns_description')}
                                confirmMessage={t('settings.confirm_delete_supplier_returns')}
                                onDelete={async (password) => {
                                    const response = await axios.post('/api/supplier-returns/delete-all', { password });
                                    return {
                                        success: response.data.success,
                                        data: response.data.data,
                                        message: response.data.message,
                                    };
                                }}
                                successMessage={t('settings.supplier_returns_deleted_success')}
                                successCountMessage={(count) => t('settings.supplier_returns_deleted_count', { count })}
                                icon={<RotateCcw className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            />

                            {/* Delete Expenses */}
                            <DeleteAllCard
                                title={t('settings.delete_all_expenses')}
                                description={t('settings.delete_all_expenses_description')}
                                confirmMessage={t('settings.confirm_delete_expenses')}
                                onDelete={async (password) => {
                                    const response = await expenseService.deleteAllExpenses(password);
                                    return {
                                        success: response.success,
                                        data: response.data,
                                        message: response.message,
                                    };
                                }}
                                successMessage={t('settings.expenses_deleted_success')}
                                successCountMessage={(count) => t('settings.expenses_deleted_count', { count })}
                                icon={<DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            />

                            {/* Delete Supplier Payments */}
                            <DeleteAllCard
                                title={t('settings.delete_all_supplier_payments')}
                                description={t('settings.delete_all_supplier_payments_description')}
                                confirmMessage={t('settings.confirm_delete_supplier_payments')}
                                onDelete={async (password) => {
                                    const response = await axios.post('/api/supplier-payments/delete-all', { password });
                                    return {
                                        success: response.data.success,
                                        data: response.data.data,
                                        message: response.data.message,
                                    };
                                }}
                                successMessage={t('settings.supplier_payments_deleted_success')}
                                successCountMessage={(count) => t('settings.supplier_payments_deleted_count', { count })}
                                icon={<CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />}
                            />
                        </div>
                    </TabsContent>
                </TabsProvider>

            </div>
        </AppLayout>
    );
}
