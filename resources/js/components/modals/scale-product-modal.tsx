import { ItemImageField } from '@/components/forms/item-image-field';
import { useItemImage } from '@/hooks/use-item-image';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { getCurrencySymbol } from '@/lib/currency';
import { categoryService, type Category } from '@/services/business/categoryService';
import {
    scaleProductService,
    type ScaleProduct,
} from '@/services/business/scaleProductService';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { Loader2, Scale, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRemember } from '@inertiajs/react';

interface ScaleProductModalProps {
    isOpen: boolean;
    onClose: (updatedData?: ScaleProduct) => void;
    editScaleProduct?: ScaleProduct; // Scale product data for editing
}

export function ScaleProductModal({
    isOpen,
    onClose,
    editScaleProduct,
}: ScaleProductModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        supplierId: '',
        scaleId: '',
        plu: '',
        unitType: 'kg',
        costPrice: '',
        sellPrice: '',
        stock: '',
        minStock: '5',
    });

    // Form state
    const [saving, setSaving] = useState(false);
    const itemImage = useItemImage(isOpen, editScaleProduct?.id as number | undefined);
    const [error, setError] = useState<string | null>(null);

    // Category and supplier data (cached)
    const [categories, setCategories] = useRemember<Category[]>([], 'scale-product-modal:categories');
    const [suppliers, setSuppliers] = useRemember<Supplier[]>([], 'scale-product-modal:suppliers');
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    // Category search state
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );

    // Supplier search state
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
        null,
    );

    // Refs for click outside handling
    const categoryRef = useRef<HTMLDivElement>(null);
    const supplierRef = useRef<HTMLDivElement>(null);

    // Filter categories from cached data (no API calls)
    const filteredCategories = useMemo(() => {
        if (!categorySearchTerm.trim()) {
            return categories;
        }
        return categories.filter(category =>
            category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
        );
    }, [categories, categorySearchTerm]);

    // Filter suppliers from cached data (no API calls)
    const filteredSuppliers = useMemo(() => {
        if (!supplierSearchTerm.trim()) {
            return suppliers;
        }
        return suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
            supplier.supplier_code.toLowerCase().includes(supplierSearchTerm.toLowerCase())
        );
    }, [suppliers, supplierSearchTerm]);

    // Auto-calculated fields
    const profitMargin = useMemo(() => {
        const cost = parseFloat(formData.costPrice) || 0;
        const sell = parseFloat(formData.sellPrice) || 0;
        if (cost > 0 && sell > 0) {
            return (((sell - cost) / cost) * 100).toFixed(2);
        }
        return '0.00';
    }, [formData.costPrice, formData.sellPrice]);

    // Load categories
    const loadCategories = useCallback(async (search: string = '') => {
        setLoadingCategories(true);
        try {
            const response = await categoryService.getCategories(search);
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch {
            // Failed to load categories
        } finally {
            setLoadingCategories(false);
        }
    }, [setCategories]);

    // Load suppliers
    const loadSuppliers = useCallback(async (search: string = '') => {
        setLoadingSuppliers(true);
        try {
            const response = await supplierService.getSuppliers(search);
            if (response.success && response.data) {
                setSuppliers(response.data);
            }
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setLoadingSuppliers(false);
        }
    }, [setSuppliers]);

    // Load data when modal opens (only if not cached)
    useEffect(() => {
        if (isOpen) {
            if (categories.length === 0) {
                loadCategories();
            }
            if (suppliers.length === 0) {
                loadSuppliers();
            }

            // Populate form if editing
            if (editScaleProduct) {
                setFormData({
                    name: editScaleProduct.name || '',
                    categoryId:
                        (
                            editScaleProduct.category_id as number | undefined
                        )?.toString() || '',
                    supplierId:
                        (
                            editScaleProduct.supplier_id as number | undefined
                        )?.toString() || '',
                    scaleId: (editScaleProduct.scale_id as string) || '',
                    plu: (editScaleProduct.plu as string) || '',
                    unitType:
                        (editScaleProduct.unit_type as 'kg' | 'piece') || 'kg',
                    costPrice:
                        (
                            editScaleProduct.cost_price as number | undefined
                        )?.toString() || '',
                    sellPrice:
                        (
                            editScaleProduct.sell_price as number | undefined
                        )?.toString() || '',
                    stock:
                        (
                            editScaleProduct.stock as number | undefined
                        )?.toString() || '',
                    minStock:
                        (
                            editScaleProduct.min_stock as number | undefined
                        )?.toString() || '5',
                });

                // Set selected category and supplier if available
                if (editScaleProduct.category) {
                    const category = editScaleProduct.category;
                    if (typeof category === 'object' && category !== null) {
                        setSelectedCategory(category as Category);
                    } else {
                        setSelectedCategory({
                            id: editScaleProduct.category_id as number,
                            name: category as string,
                            created_at: '',
                            updated_at: '',
                        });
                    }
                }

                if (editScaleProduct.supplier) {
                    const supplier = editScaleProduct.supplier;
                    if (
                        typeof supplier === 'object' &&
                        supplier !== null &&
                        'supplier_code' in supplier
                    ) {
                        setSelectedSupplier(supplier as Supplier);
                    } else if (
                        typeof supplier === 'object' &&
                        supplier !== null
                    ) {
                        setSelectedSupplier({
                            id: editScaleProduct.supplier_id as number,
                            name: (supplier as { name: string }).name,
                            supplier_code: '',
                            email: null,
                            phone: '',
                            business_name: null,
                            business_address: null,
                            business_phone: null,
                            business_email: null,
                            billing_contact_name: null,
                            billing_contact_phone: null,
                            billing_contact_email: null,
                            biller_position: null,
                            total_amount: 0,
                            total_paid: 0,
                            remain_amount: 0,
                            created_at: '',
                            updated_at: '',
                        });
                    }
                }
            }
        }
    }, [isOpen, categories.length, suppliers.length, loadCategories, loadSuppliers, editScaleProduct]);


    // Handle category selection
    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        handleInputChange('categoryId', category.id.toString());
        setCategoryDropdownOpen(false);
        setCategorySearchTerm('');
    };

    // Handle supplier selection
    const handleSupplierSelect = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        handleInputChange('supplierId', supplier.id.toString());
        setSupplierDropdownOpen(false);
        setSupplierSearchTerm('');
    };

    // Clear category selection
    const clearCategorySelection = () => {
        setSelectedCategory(null);
        handleInputChange('categoryId', '');
    };

    // Clear supplier selection
    const clearSupplierSelection = () => {
        setSelectedSupplier(null);
        handleInputChange('supplierId', '');
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                categoryRef.current &&
                !categoryRef.current.contains(event.target as Node)
            ) {
                setCategoryDropdownOpen(false);
            }
            if (
                supplierRef.current &&
                !supplierRef.current.contains(event.target as Node)
            ) {
                setSupplierDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            // Auto-set min_stock to 5 if not filled
            if (field === 'stock' && !prev.minStock) {
                newData.minStock = '5';
            }

            return newData;
        });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Prevent duplicate submissions
        if (saving) {
            return;
        }
        // Validate required fields
        const requiredFields = {
            name: formData.name,
            scaleId: formData.scaleId || '22', // default to 22 if empty
            plu: formData.plu,
            costPrice: formData.costPrice,
            sellPrice: formData.sellPrice,
            stock: formData.stock,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            setError(
                t('scale_product.fill_required_fields', {
                    fields: missingFields.join(', '),
                }) ||
                    `Please fill in all required fields: ${missingFields.join(', ')}`,
            );
            return;
        }

        // Validate PLU is exactly 5 digits
        if (!/^\d{5}$/.test(formData.plu)) {
            setError(
                t('scale_product.plu_must_be_5_digits') ||
                    'PLU must be exactly 5 digits',
            );
            return;
        }

        // Validate Scale ID is exactly 2 digits and doesn't start with 0
        const scaleId = formData.scaleId || '22';
        if (!/^[1-9]\d$/.test(scaleId)) {
            setError(
                t('scale_product.scale_id_must_be_2_digits') ||
                    'Scale ID must be exactly 2 digits',
            );
            return;
        }

        setSaving(true);
        setError(null);

        // Save scale product - create or update
        const isEditing = !!editScaleProduct;

        try {
            // Prepare scale product data
            const scaleProductData = {
                name: formData.name,
                category_id: formData.categoryId
                    ? parseInt(formData.categoryId)
                    : undefined,
                supplier_id: formData.supplierId
                    ? parseInt(formData.supplierId)
                    : undefined,
                scale_id: formData.scaleId || '22', // default to 22 if empty
                plu: formData.plu,
                unit_type: formData.unitType as 'kg',
                cost_price: parseFloat(formData.costPrice),
                sell_price: parseFloat(formData.sellPrice),
                stock: parseFloat(formData.stock),
                min_stock: formData.minStock.trim() === '' ? 5 : parseFloat(formData.minStock),
                show_in_pos: false,
            };

            const response = isEditing
                ? await scaleProductService.updateScaleProduct(
                      editScaleProduct.id,
                      scaleProductData,
                      itemImage.file,
                      itemImage.remove,
                  )
                : await scaleProductService.createScaleProduct(
                      scaleProductData,
                      itemImage.file,
                      itemImage.remove,
                  );

            if (response.success) {
                // Don't show toast here - parent component will show it
                // Prepare the data to pass back for smart update
                const productId =
                    response.data?.id ||
                    (isEditing ? editScaleProduct.id : undefined);
                const savedScaleProductData = productId
                    ? ({
                          ...(response.data || scaleProductData),
                          id: productId,
                          category: selectedCategory,
                          supplier: selectedSupplier,
                      } as ScaleProduct)
                    : undefined;

                // Reset form and close modal with saved data
                setFormData({
                    name: '',
                    categoryId: '',
                    supplierId: '',
                    scaleId: '',
                    plu: '',
                    unitType: 'kg',
                    costPrice: '',
                    sellPrice: '',
                    stock: '',
                    minStock: '5',
                });
                setSelectedCategory(null);
                setSelectedSupplier(null);
                onClose(savedScaleProductData);
            } else {
                // Handle validation errors for duplicates
                let errorMessage = '';
                if (response.errors) {
                    if (response.errors.name) {
                        errorMessage = t('scale_product.validation.error_name', { error: response.errors.name[0] });
                    } else if (response.errors.image) {
                        errorMessage = response.errors.image[0];
                    } else if (response.errors.plu) {
                        errorMessage = t('scale_product.validation.error_plu', { error: response.errors.plu[0] });
                    } else if (response.errors.scale_id) {
                        errorMessage = t('scale_product.validation.error_scale_id', { error: response.errors.scale_id[0] });
                    } else {
                        errorMessage =
                            response.message ||
                            `Failed to ${isEditing ? 'update' : 'create'} scale product`;
                    }
                } else {
                    errorMessage =
                        response.message ||
                        (isEditing
                            ? t('scale_product.update_failed') ||
                              'Failed to update scale product'
                            : t('scale_product.create_failed') ||
                              'Failed to create scale product');
                }

                toast({
                    title: isEditing
                        ? t('common.update_failed') || 'Update Failed'
                        : t('common.creation_failed') || 'Creation Failed',
                    description: errorMessage,
                    type: 'error',
                });
                setError(errorMessage);
            }
        } catch (err: unknown) {
            const errorMessage =
                (err as { message?: string }).message ||
                (isEditing
                    ? t('scale_product.update_failed') ||
                      'Failed to update scale product'
                    : t('scale_product.create_failed') ||
                      'Failed to create scale product');
            toast({
                title: t('common.operation_failed') || 'Operation Failed',
                description: errorMessage,
                type: 'error',
            });
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            categoryId: '',
            supplierId: '',
            scaleId: '',
            plu: '',
            unitType: 'kg',
            costPrice: '',
            sellPrice: '',
            stock: '',
            minStock: '5',
        });
        setError(null);
        setSelectedCategory(null);
        setSelectedSupplier(null);
        setCategorySearchTerm('');
        setSupplierSearchTerm('');
        setCategoryDropdownOpen(false);
        setSupplierDropdownOpen(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto [&>button]:hidden border-teal-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-teal-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                }}
            >
                <DialogHeader className="border-b border-teal-200 pb-4 dark:border-teal-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-teal-800 dark:text-teal-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                            <Scale className="h-4 w-4 text-white" />
                        </div>
                        {editScaleProduct
                            ? t('scale_product.edit_title') ||
                              'Edit Scale Product'
                            : t('scale_product.add_title') ||
                              'Add Scale Product'}
                    </DialogTitle>
                </DialogHeader>

                <form
                    id="scale-product-form"
                    onSubmit={handleSave}
                    className="space-y-6"
                >
                    {/* Error Display */}
                    {error && (
                        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <ItemImageField value={itemImage.file} remove={itemImage.remove} onChange={itemImage.change} disabled={saving} existingUrl={typeof editScaleProduct?.image_url === 'string' ? editScaleProduct.image_url : null} />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="name"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.product_name') ||
                                    'Product Name'}{' '}
                                *
                            </Label>
                            <Input
                                id="name"
                                placeholder={
                                    t(
                                        'scale_product.product_name_placeholder',
                                    ) || 'Enter product name'
                                }
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange('name', e.target.value)
                                }
                                className="h-11"
                            />
                        </div>

                        {/* Category Search */}
                        <div className="relative space-y-2" ref={categoryRef}>
                            <Label
                                htmlFor="category"
                                className="text-sm font-medium"
                            >
                                {t('common.category_optional') ||
                                    'Category (Optional)'}
                            </Label>
                            <div className="relative">
                                {selectedCategory ? (
                                    <div className="flex h-11 items-center justify-between rounded-md border border-input bg-background p-3 transition-colors hover:border-ring">
                                        <span className="text-sm">
                                            {selectedCategory.name}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={clearCategorySelection}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Input
                                            placeholder={
                                                t('common.search_categories') ||
                                                'Search categories...'
                                            }
                                            value={categorySearchTerm}
                                            onChange={(e) =>
                                                setCategorySearchTerm(
                                                    e.target.value,
                                                )
                                            }
                                            onFocus={() =>
                                                setCategoryDropdownOpen(true)
                                            }
                                            className="h-11 pr-10"
                                        />
                                        <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    </>
                                )}

                                {/* Category Dropdown */}
                                {categoryDropdownOpen && !selectedCategory && (
                                    <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                                        {loadingCategories ? (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                                                {t('common.loading') ||
                                                    'Loading...'}
                                            </div>
                                        ) : filteredCategories.length > 0 ? (
                                            filteredCategories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                    onClick={() =>
                                                        handleCategorySelect(
                                                            category,
                                                        )
                                                    }
                                                >
                                                    {category.name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'common.no_categories_found',
                                                ) || 'No categories found'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Supplier Search */}
                        <div className="relative space-y-2" ref={supplierRef}>
                            <Label
                                htmlFor="supplier"
                                className="text-sm font-medium"
                            >
                                {t('common.supplier_optional') ||
                                    'Supplier (Optional)'}
                            </Label>
                            <div className="relative">
                                {selectedSupplier ? (
                                    <div className="flex h-11 items-center justify-between rounded-md border border-input bg-background p-3 transition-colors hover:border-ring">
                                        <div className="flex flex-col">
                                            <span className="text-sm">
                                                {selectedSupplier.name}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={clearSupplierSelection}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Input
                                            placeholder={
                                                t('common.search_suppliers') ||
                                                'Search suppliers...'
                                            }
                                            value={supplierSearchTerm}
                                            onChange={(e) =>
                                                setSupplierSearchTerm(
                                                    e.target.value,
                                                )
                                            }
                                            onFocus={() =>
                                                setSupplierDropdownOpen(true)
                                            }
                                            className="h-11 pr-10"
                                        />
                                        <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    </>
                                )}

                                {/* Supplier Dropdown */}
                                {supplierDropdownOpen && !selectedSupplier && (
                                    <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                                        {loadingSuppliers ? (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                                                {t('common.loading') ||
                                                    'Loading...'}
                                            </div>
                                        ) : filteredSuppliers.length > 0 ? (
                                            filteredSuppliers.map((supplier) => (
                                                <button
                                                    key={supplier.id}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                    onClick={() =>
                                                        handleSupplierSelect(
                                                            supplier,
                                                        )
                                                    }
                                                >
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {supplier.name}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'common.no_suppliers_found',
                                                ) || 'No suppliers found'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scale ID */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="scaleId"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.scale_id') || 'Scale ID'} *{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (
                                    {t('scale_product.scale_id_hint') ||
                                        'Must be exactly 2 digits'}
                                    )
                                </span>
                            </Label>
                            <Input
                                id="scaleId"
                                placeholder={t('scale_product.scale_id_placeholder') || "22"}
                                maxLength={2}
                                pattern="[1-9]\d"
                                value={formData.scaleId}
                                onChange={(e) => {
                                    // Only allow digits, limit to 2 characters, and prevent starting with 0
                                    let value = e.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, 2);
                                    // If user tries to enter 0 as first digit, ignore it
                                    if (value.length === 1 && value === '0') {
                                        value = '';
                                    }
                                    handleInputChange('scaleId', value);
                                }}
                                className="h-11 font-mono"
                                required
                            />
                        </div>

                        {/* PLU */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="plu"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.plu') || 'PLU'} *{' '}
                                <span className="text-xs font-normal text-muted-foreground">
                                    (
                                    {t('scale_product.plu_hint') ||
                                        'Must be exactly 5 digits'}
                                    )
                                </span>
                            </Label>
                            <Input
                                id="plu"
                                type="text"
                                placeholder="12345"
                                maxLength={5}
                                pattern="\d{5}"
                                value={formData.plu}
                                onChange={(e) => {
                                    // Only allow digits and limit to 5 characters
                                    const value = e.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, 5);
                                    handleInputChange('plu', value);
                                }}
                                className="h-11 font-mono"
                            />
                        </div>

                        {/* Unit Type */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="unitType"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.unit_type') || 'Unit Type'}
                            </Label>
                            <Select
                                value={formData.unitType}
                                onValueChange={(value) =>
                                    handleInputChange('unitType', value)
                                }
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue
                                        placeholder={
                                            t(
                                                'scale_product.select_unit_type',
                                            ) || 'Select unit type'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">
                                        {t('inventory.table.kg', {
                                            defaultValue: 'kg',
                                        })}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cost Price */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="costPrice"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.cost_price') || 'Cost Price'}{' '}
                                ({getCurrencySymbol()}{' '}
                                {t('scale_product.per_kg') || 'per 1 kg'}) *
                            </Label>
                            <Input
                                id="costPrice"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={formData.costPrice}
                                onChange={(e) =>
                                    handleInputChange(
                                        'costPrice',
                                        e.target.value,
                                    )
                                }
                                className="h-11"
                            />
                        </div>

                        {/* Sell Price */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="sellPrice"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.sell_price') || 'Sell Price'}{' '}
                                ({getCurrencySymbol()}{' '}
                                {t('scale_product.per_kg') || 'per 1 kg'}) *
                            </Label>
                            <Input
                                id="sellPrice"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={formData.sellPrice}
                                onChange={(e) =>
                                    handleInputChange(
                                        'sellPrice',
                                        e.target.value,
                                    )
                                }
                                className="h-11"
                            />
                        </div>

                        {/* Profit Margin (Auto) */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="profitMargin"
                                className="text-sm font-medium"
                            >
                                {t('common.profit_margin_auto') ||
                                    'Profit Margin (Auto)'}
                            </Label>
                            <Input
                                id="profitMargin"
                                value={`${profitMargin}%`}
                                readOnly
                                className="bg-muted"
                            />
                        </div>

                        {/* Stock */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="stock"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.stock_kg') || 'Stock (kg)'} *
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) =>
                                    handleInputChange('stock', e.target.value)
                                }
                                className="h-11"
                            />
                        </div>

                        {/* Min Stock */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="minStock"
                                className="text-sm font-medium"
                            >
                                {t('scale_product.min_stock_kg') ||
                                    'Minimum Stock (kg)'}
                            </Label>
                            <Input
                                id="minStock"
                                type="number"
                                step="0.01"
                                placeholder="5"
                                value={formData.minStock}
                                onChange={(e) =>
                                    handleInputChange(
                                        'minStock',
                                        e.target.value,
                                    )
                                }
                                className="h-11"
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter className="border-t border-teal-200 pt-4 dark:border-teal-800">
                    <Button variant="outline" onClick={handleClose} className="border-teal-300 bg-teal-50 text-teal-700 hover:border-teal-500 hover:bg-teal-100 hover:text-teal-800 focus:border-teal-500 focus:bg-teal-100 focus:ring-2 focus:ring-teal-200 focus:outline-none dark:border-teal-600 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/30 dark:hover:text-teal-200 dark:focus:border-teal-500 dark:focus:bg-teal-900/30 dark:focus:ring-2 dark:focus:ring-teal-400">
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        type="submit"
                        form="scale-product-form"
                        disabled={saving}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 focus:ring-2 focus:ring-teal-200 focus:outline-none disabled:opacity-50 dark:from-teal-600 dark:to-teal-700 dark:hover:from-teal-700 dark:hover:to-teal-800 dark:focus:ring-2 dark:focus:ring-teal-400"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editScaleProduct
                                    ? t('scale_product.updating') ||
                                      'Updating...'
                                    : t('scale_product.saving') || 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Scale className="mr-2 h-4 w-4" />
                                {editScaleProduct
                                    ? t('scale_product.update_button') ||
                                      'Update Scale Product'
                                    : t('scale_product.add_button') ||
                                      'Add Scale Product'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
