import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
import { Button } from '@/components/ui/button';
import { DeleteModal } from '@/components/ui/delete-modal';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { categoryService, type Category } from '@/services/business/categoryService';
import { Edit, Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const CategoryImportPanel = lazy(() => import('./category-import-panel'));

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChanged?: () => void;
}

export function CategoryModal({ isOpen, onClose, onChanged }: CategoryModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importBusy, setImportBusy] = useState(false);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
        null,
    );
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
    const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);

    // Load categories when modal opens
    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    // Load categories with search
    useEffect(() => {
        if (isOpen) {
            const timeoutId = setTimeout(() => {
                loadCategories(searchTerm);
            }, 300); // Debounce search

            return () => clearTimeout(timeoutId);
        }
    }, [searchTerm, isOpen]);

    const loadCategories = async (search: string = '') => {
        setLoading(true);
        setError(null);
        try {
            const response = await categoryService.getCategories(search);
            if (response.success && response.data) {
                setCategories(response.data);
            } else {
                setError(response.message || 'Failed to load categories');
            }
        } catch {
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!categoryName.trim()) return;

        // Prevent duplicate submissions
        if (saving) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            let response;
            if (editingCategory) {
                response = await categoryService.updateCategory(
                    editingCategory.id,
                    categoryName,
                );
            } else {
                response = await categoryService.createCategory(categoryName);
            }

            if (response.success) {
                // Show success toast
                toast({
                    title: editingCategory
                        ? t('category_modal.messages.category_updated')
                        : t('category_modal.messages.category_created'),
                    description: editingCategory
                        ? t('category_modal.messages.category_updated_desc', {
                              categoryName,
                          })
                        : t('category_modal.messages.category_created_desc', {
                              categoryName,
                          }),
                    type: 'success',
                });

                // Reload categories to show the updated list
                await loadCategories(searchTerm);
                onChanged?.();
                // Reset form
                setCategoryName('');
                setEditingCategory(null);
            } else {
                toast({
                    title: editingCategory
                        ? t('category_modal.messages.update_failed')
                        : t('category_modal.messages.creation_failed'),
                    description:
                        response.message ||
                        t('category_modal.messages.failed_to_save_category'),
                    type: 'error',
                });
                setError(
                    response.message ||
                        t('category_modal.messages.failed_to_save_category'),
                );
            }
        } catch {
            toast({
                title: t('category_modal.messages.operation_failed'),
                description: t('category_modal.messages.unexpected_error'),
                type: 'error',
            });
            setError(t('category_modal.messages.failed_to_save_category'));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
    };

    const handleDeleteClick = async (category: Category) => {
        setCategoryToDelete(category);
        setDeleteWarning(null);
        setIsDeleteDisabled(false);

        // Check if category is in use
        try {
            const response = await categoryService.checkCategoryUsage(
                category.id,
            );
            if (response.success && response.data) {
                if (!response.data.can_delete) {
                    const totalCount = response.data.total_usage;
                    const productCount = response.data.products_count;
                    const scaleProductCount =
                        response.data.scale_products_count;

                    let warningMessage = t(
                        'category_modal.messages.category_in_use',
                        {
                            totalCount,
                            plural: totalCount > 1 ? 's' : '',
                        },
                    );
                    if (SCALE_PRODUCTS_ENABLED && productCount > 0 && scaleProductCount > 0) {
                        warningMessage +=
                            ' (' +
                            t('category_modal.messages.products_count', {
                                productCount,
                                plural: productCount > 1 ? 's' : '',
                            }) +
                            ' and ' +
                            t('category_modal.messages.scale_products_count', {
                                scaleProductCount,
                                plural: scaleProductCount > 1 ? 's' : '',
                            }) +
                            ')';
                    } else if (SCALE_PRODUCTS_ENABLED && productCount > 0) {
                        warningMessage +=
                            ' (' +
                            t('category_modal.messages.products_count', {
                                productCount,
                                plural: productCount > 1 ? 's' : '',
                            }) +
                            ')';
                    } else if (SCALE_PRODUCTS_ENABLED && scaleProductCount > 0) {
                        warningMessage +=
                            ' (' +
                            t('category_modal.messages.scale_products_count', {
                                scaleProductCount,
                                plural: scaleProductCount > 1 ? 's' : '',
                            }) +
                            ')';
                    }
                    warningMessage += t(
                        'category_modal.messages.reassign_items',
                    );

                    setDeleteWarning(warningMessage);
                    setIsDeleteDisabled(true);
                }
            }
        } catch {
            setDeleteWarning(t('category_modal.messages.unable_to_verify'));
            setIsDeleteDisabled(true);
        }

        setIsDeleteModalOpen(true);
    };

    const handleDeleteModalClose = () => {
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
        setDeleteWarning(null);
        setIsDeleteDisabled(false);
    };

    // Delete function
    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        try {
            const response = await categoryService.deleteCategory(
                categoryToDelete.id,
            );
            if (response.success) {
                toast({
                    title: t('category_modal.messages.category_deleted'),
                    description: t(
                        'category_modal.messages.category_deleted_desc',
                        {
                            categoryToDelete: categoryToDelete.name,
                        },
                    ),
                    type: 'success',
                });
                handleDeleteModalClose();
                await loadCategories();
                onChanged?.();
            } else {
                toast({
                    title: t('category_modal.messages.delete_failed'),
                    description:
                        response.message ||
                        t('category_modal.messages.delete_failed_desc'),
                    type: 'error',
                });
            }
        } catch {
            toast({
                title: t('category_modal.messages.delete_failed'),
                description: t(
                    'category_modal.messages.delete_unexpected_error',
                ),
                type: 'error',
            });
        }
    };

    const handleCancel = () => {
        setCategoryName('');
        setEditingCategory(null);
        setError(null);
    };

    const handleClose = () => {
        if (importBusy) return;
        setImportOpen(false);
        setCategoryName('');
        setEditingCategory(null);
        setSearchTerm('');
        setError(null);
        // Close delete modal if open
        if (isDeleteModalOpen) {
            handleDeleteModalClose();
        }
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent
                    className="max-h-[90vh] overflow-y-auto [&>button]:hidden border-purple-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-purple-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                    style={{
                        zIndex: 9999,
                        maxWidth: '50rem',
                        width: 'calc(100% - 2rem)',
                    }}
                >
                    <DialogHeader className="border-b border-purple-200 pb-4 dark:border-purple-800">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-purple-800 dark:text-purple-200">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                                <Plus className="h-4 w-4 text-white" />
                            </div>
                            <span>{t('category.title')}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {importOpen ? (
                        <Suspense fallback={<p role="status">{t('category_modal.messages.loading_categories')}</p>}>
                            <CategoryImportPanel
                                onBack={() => setImportOpen(false)}
                                onBusyChange={setImportBusy}
                                onImported={() => {
                                    void loadCategories(searchTerm);
                                    onChanged?.();
                                }}
                            />
                        </Suspense>
                    ) : <div className="space-y-6">
                        {/* Error Display */}
                        {error && (
                            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            </div>
                        )}
                        {/* Category Management Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold">
                                {t('category_modal.title')}
                            </h3>
                            <Button type="button" variant="outline" disabled={saving} onClick={() => setImportOpen(true)}>
                                <Upload className="mr-2 size-4" />
                                {t('category_import.title')}
                            </Button>
                        </div>

                        {/* Category Name Input */}
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">
                                {t('category.name')}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="categoryName"
                                    placeholder={t('category.name_placeholder')}
                                    value={categoryName}
                                    onChange={(e) =>
                                        setCategoryName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSave();
                                        }
                                    }}
                                    className="flex-1 border-purple-300 focus:border-purple-500 focus:ring-purple-200 dark:border-purple-600 dark:focus:border-purple-500 dark:focus:ring-purple-400"
                                />
                                <Button
                                    onClick={handleSave}
                                    disabled={!categoryName.trim() || saving}
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-200 focus:outline-none disabled:opacity-50 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 dark:focus:ring-2 dark:focus:ring-purple-400"
                                >
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    {editingCategory
                                        ? t('category.update')
                                        : t('category.add')}
                                </Button>
                                {editingCategory && (
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        size="sm"
                                        className="border-purple-300 bg-purple-50 text-purple-700 hover:border-purple-500 hover:bg-purple-100 hover:text-purple-800 focus:border-purple-500 focus:bg-purple-100 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 dark:hover:text-purple-200 dark:focus:border-purple-500 dark:focus:bg-purple-900/30 dark:focus:ring-2 dark:focus:ring-purple-400"
                                    >
                                        {t('category.cancel')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="space-y-2">
                            <Label htmlFor="search">
                                {t('category.search')}
                            </Label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-purple-500 dark:text-purple-400" />
                                <Input
                                    id="search"
                                    placeholder={t(
                                        'category.search_placeholder',
                                    )}
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 border-purple-300 focus:border-purple-500 focus:ring-purple-200 dark:border-purple-600 dark:focus:border-purple-500 dark:focus:ring-purple-400"
                                />
                            </div>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-2">
                            <Label>{t('category.available_categories')}</Label>
                            <div className="h-64 w-full overflow-y-auto rounded-md border">
                                <div className="space-y-3 p-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-muted-foreground">
                                                {t(
                                                    'category_modal.messages.loading_categories',
                                                )}
                                            </span>
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="py-8 text-center text-muted-foreground">
                                            {searchTerm
                                                ? t('category.no_results')
                                                : t('category.no_categories')}
                                        </div>
                                    ) : (
                                        categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-center justify-between rounded-lg border border-purple-200 bg-card p-3 transition-colors hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-purple-800 dark:text-purple-200">
                                                        {category.name}
                                                    </div>
                                                    <div className="text-xs text-purple-600 dark:text-purple-400">
                                                        {t('category.created')}:{' '}
                                                        {category.created_at
                                                            ? new Date(
                                                                  category.created_at,
                                                              ).toLocaleDateString()
                                                            : 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEdit(category)
                                                        }
                                                        className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                                    >
                                                        <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                category,
                                                            )
                                                        }
                                                        className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>}

                    <DialogFooter className="border-t border-purple-200 pt-4 dark:border-purple-800">
                        <Button variant="outline" onClick={handleClose} disabled={importBusy} className="border-purple-300 bg-purple-50 text-purple-700 hover:border-purple-500 hover:bg-purple-100 hover:text-purple-800 focus:border-purple-500 focus:bg-purple-100 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 dark:hover:text-purple-200 dark:focus:border-purple-500 dark:focus:bg-purple-900/30 dark:focus:ring-2 dark:focus:ring-purple-400">
                            {t('category.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal - Rendered outside parent dialog */}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteModalClose}
                onConfirm={handleDeleteConfirm}
                title={t('category.delete_title') || 'Delete Category'}
                description={
                    deleteWarning ||
                    t('category.delete_confirmation', {
                        name: categoryToDelete?.name || '',
                    }) ||
                    `Are you sure you want to delete "${categoryToDelete?.name || ''}"? This action cannot be undone.`
                }
                confirmButtonText={t('common.delete') || 'Delete'}
                cancelButtonText={t('common.cancel') || 'Cancel'}
                warning={deleteWarning || undefined}
                isDeleteDisabled={isDeleteDisabled}
            />
        </>
    );
}
