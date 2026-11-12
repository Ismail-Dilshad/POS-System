import { PRODUCT_ADVANCED_FIELDS_ENABLED } from '@/config/features';
import { ItemImageField } from '@/components/forms/item-image-field';
import { useItemImage } from '@/hooks/use-item-image';
import { BarcodePreviewModal } from '@/components/modals/barcode-preview-modal';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { getCurrencySymbol } from '@/lib/currency';
import {
    barcodeDetectionService,
    type BarcodeDetectionResult,
} from '@/services/utils/barcodeDetectionService';
import { barcodeService, type BarcodeType } from '@/services/utils/barcodeService';
import { categoryService, type Category } from '@/services/business/categoryService';
import { productService } from '@/services/business/productService';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import type { Product } from '@/types';
import {
    CheckCircle,
    Eye,
    Loader2,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRemember } from '@inertiajs/react';

interface ProductModalProps {
    isOpen: boolean;
    onClose: (updatedData?: Record<string, unknown>) => void;
    editProduct?: Record<string, unknown>; // Product data for editing mode
    prefillBarcode?: string; // Barcode to pre-fill when opening modal
}

const BARCODE_TYPES = [
    { value: 'ean13', label: 'EAN-13' },
    { value: 'ean8', label: 'EAN-8' },
    { value: 'upc', label: 'UPC-A' },
    { value: 'code128', label: 'Code 128' },
    { value: 'code39', label: 'Code 39' },
    { value: 'custom', label: 'Custom' },
];

export function ProductModal({
    isOpen,
    onClose,
    editProduct,
    prefillBarcode,
}: ProductModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState<{
        name: string;
        categoryId: string;
        supplierId: string;
        barcodeType: BarcodeType;
        barcode: string;
        secondaryBarcode: string;
        costPrice: string;
        sellPrice: string;
        stock: string;
        minStock: string;
        perCarton: string;
        cartonPrice: string;
        expireDate: string;
        showInPos: boolean;
    }>({
        name: '',
        categoryId: '',
        supplierId: '',
        barcodeType: 'ean13',
        barcode: '',
        secondaryBarcode: '',
        costPrice: '',
        sellPrice: '',
        stock: '',
        minStock: '',
        perCarton: '',
        cartonPrice: '',
        expireDate: '',
        showInPos: false,
    });

    // Form state
    const [saving, setSaving] = useState(false);
    const itemImage = useItemImage(isOpen, editProduct?.id as number | undefined);
    const [error, setError] = useState<string | null>(null);

    // Category and supplier data (cached)
    const [categories, setCategories] = useRemember<Category[]>([], 'product-modal:categories');
    const [suppliers, setSuppliers] = useRemember<Supplier[]>([], 'product-modal:suppliers');
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

    // Barcode preview modal state
    const [barcodePreviewOpen, setBarcodePreviewOpen] = useState(false);

    // Barcode auto-detection state
    const [barcodeDetection, setBarcodeDetection] =
        useState<BarcodeDetectionResult | null>(null);
    const [showBarcodeTypeSelection, setShowBarcodeTypeSelection] =
        useState(false);

    const [cartonPriceManuallyEdited, setCartonPriceManuallyEdited] = useState(false);

    // Auto-calculated fields
    const profitMargin = useMemo(() => {
        const cost = parseFloat(formData.costPrice) || 0;
        const sell = parseFloat(formData.sellPrice) || 0;
        if (cost > 0 && sell > 0) {
            return (((sell - cost) / cost) * 100).toFixed(2);
        }
        return '0.00';
    }, [formData.costPrice, formData.sellPrice]);

    const daysUntilExpire = useMemo(() => {
        if (formData.expireDate) {
            const expireDate = new Date(formData.expireDate);
            const today = new Date();
            const diffTime = expireDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 0;
        }
        return 0;
    }, [formData.expireDate]);

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
        }
    }, [isOpen, categories.length, suppliers.length, loadCategories, loadSuppliers]);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editProduct) {
                // Edit mode - populate form with existing product data
                setFormData({
                    name: (editProduct.name as string) || '',
                    categoryId:
                        (
                            editProduct.category_id as number | undefined
                        )?.toString() || '',
                    supplierId:
                        (
                            editProduct.supplier_id as number | undefined
                        )?.toString() || '',
                    barcodeType:
                        (editProduct.barcode_type as BarcodeType) || 'ean13',
                    barcode: (editProduct.barcode as string) || '',
                    secondaryBarcode:
                        (editProduct.secondary_barcode as string) || '',
                    costPrice:
                        (
                            editProduct.cost_price as number | undefined
                        )?.toString() || '',
                    sellPrice:
                        (
                            editProduct.sell_price as number | undefined
                        )?.toString() || '',
                    stock:
                        (editProduct.stock as number | undefined)?.toString() ||
                        '',
                    minStock:
                        (
                            editProduct.min_stock as number | undefined
                        )?.toString() || '',
                    perCarton:
                        (
                            editProduct.per_carton as number | undefined
                        )?.toString() || '',
                    cartonPrice:
                        (
                            editProduct.carton_price as number | undefined
                        )?.toString() || '',
                    expireDate: (editProduct.expire_date as string) || '',
                    showInPos: (editProduct.show_in_pos as boolean) ?? false,
                });

                // Set selected dropdowns
                if (editProduct.category) {
                    setSelectedCategory(editProduct.category as Category);
                }
                if (editProduct.supplier) {
                    setSelectedSupplier(editProduct.supplier as Supplier);
                }
                setCartonPriceManuallyEdited(
                    editProduct.carton_price !== null &&
                    editProduct.carton_price !== undefined
                );
            } else {
                // Add mode - reset form, but pre-fill barcode if provided
                setFormData({
                    name: '',
                    categoryId: '',
                    supplierId: '',
                    barcodeType: 'ean13',
                    barcode: prefillBarcode || '',
                    secondaryBarcode: '',
                    costPrice: '',
                    sellPrice: '',
                    stock: '',
                    minStock: '',
                    perCarton: '',
                    cartonPrice: '',
                    expireDate: '',
                    showInPos: false,
                });
                setCartonPriceManuallyEdited(false);
                setSelectedCategory(null);
                setSelectedSupplier(null);
            }
            setError(null);
        }
    }, [isOpen, editProduct, prefillBarcode]);

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
            supplier.supplier_code.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
            (supplier.phone && supplier.phone.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
            (supplier.email && supplier.email.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
            (supplier.business_name && supplier.business_name.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
            (supplier.billing_contact_name && supplier.billing_contact_name.toLowerCase().includes(supplierSearchTerm.toLowerCase()))
        );
    }, [suppliers, supplierSearchTerm]);

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

    // Auto-detect barcode type when barcode is entered
    const handleBarcodeInputChange = (value: string) => {
        handleInputChange('barcode', value);

        // Auto-detect barcode type if barcode is not empty
        if (value.trim().length > 0) {
            const detection = barcodeDetectionService.detectBarcodeType(value);
            setBarcodeDetection(detection);

            if (
                detection.success &&
                detection.detectedType &&
                detection.confidence !== undefined &&
                detection.confidence >= 70
            ) {
                // Auto-select detected type if confidence is high
                handleInputChange('barcodeType', detection.detectedType);
                setShowBarcodeTypeSelection(false);
            } else if (detection.success && detection.detectedType) {
                // Show selection if confidence is medium
                setShowBarcodeTypeSelection(true);
            } else {
                // Clear detection if no valid type found
                setBarcodeDetection(null);
                setShowBarcodeTypeSelection(false);
            }
        } else {
            // Clear detection if barcode is empty
            setBarcodeDetection(null);
            setShowBarcodeTypeSelection(false);
        }
    };

    // Handle barcode type selection from detection
    const handleDetectedBarcodeTypeSelect = (type: BarcodeType) => {
        handleInputChange('barcodeType', type);
        setShowBarcodeTypeSelection(false);
    };

    // Auto-generate barcode based on selected type
    const handleAutoGenerateBarcode = async () => {
        if (!formData.barcodeType) {
            setError(t('product.select_barcode_type_first'));
            return;
        }

        try {
            const result = await barcodeService.generateBarcode(
                formData.barcodeType as BarcodeType,
            );

            if (result.success && result.barcode) {
                handleInputChange('barcode', result.barcode);
                // Clear any previous error
                setError(null);
            } else {
                setError(result.error || t('product.failed_generate_barcode'));
            }
        } catch {
            setError(t('product.failed_generate_barcode'));
        }
    };

    // Handle barcode preview
    const handleBarcodePreview = () => {
        if (!formData.barcode) {
            setError(t('product.no_barcode_to_preview'));
            return;
        }
        setBarcodePreviewOpen(true);
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

    const handleInputChange = (
        field: string,
        value: string | boolean | BarcodeType,
        options: { skipCartonAuto?: boolean } = {},
    ) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            // Auto-set min_stock to 5 if not filled
            if (field === 'stock' && !prev.minStock) {
                newData.minStock = '5';
            }

            const shouldAutoPopulateCarton =
                PRODUCT_ADVANCED_FIELDS_ENABLED && !options.skipCartonAuto && !cartonPriceManuallyEdited;

            if (shouldAutoPopulateCarton) {
                const perCartonValue =
                    field === 'perCarton' ? (value as string) : newData.perCarton;
                const sellPriceValue =
                    field === 'sellPrice' ? (value as string) : newData.sellPrice;

                const perCarton = parseFloat(perCartonValue || '0');
                const sellPrice = parseFloat(sellPriceValue || '0');

                if (perCarton > 0 && sellPrice > 0) {
                    newData.cartonPrice = (perCarton * sellPrice).toFixed(2);
                } else if (newData.cartonPrice) {
                    newData.cartonPrice = '';
                }
            }

            return newData;
        });
    };

    const handleCartonPriceChange = (value: string) => {
        if (value === '') {
            setCartonPriceManuallyEdited(false);
            setFormData((prev) => {
                const perCarton = parseFloat(prev.perCarton || '0');
                const sellPrice = parseFloat(prev.sellPrice || '0');
                const autoValue =
                    perCarton > 0 && sellPrice > 0
                        ? (perCarton * sellPrice).toFixed(2)
                        : '';
                return {
                    ...prev,
                    cartonPrice: autoValue,
                };
            });
            return;
        }

        setCartonPriceManuallyEdited(true);
        handleInputChange('cartonPrice', value, { skipCartonAuto: true });
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
            categoryId: formData.categoryId,
            supplierId: formData.supplierId,
            barcode: formData.barcode,
            costPrice: formData.costPrice,
            sellPrice: formData.sellPrice,
            stock: formData.stock,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            setError(t('product.fill_required_fields'));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Prepare product data with correct field names for API
            const productData = {
                name: formData.name,
                category_id: parseInt(formData.categoryId),
                supplier_id: parseInt(formData.supplierId),
                barcode_type: formData.barcodeType,
                barcode: formData.barcode,
                secondary_barcode: formData.secondaryBarcode.trim() || null,
                cost_price: parseFloat(formData.costPrice),
                sell_price: parseFloat(formData.sellPrice),
                stock: parseInt(formData.stock),
                min_stock: formData.minStock.trim() === '' ? 5 : parseInt(formData.minStock),
                per_carton: formData.perCarton ? parseInt(formData.perCarton) : null,
                carton_price: formData.cartonPrice ? parseFloat(formData.cartonPrice) : null,
                show_in_pos: formData.showInPos,
                expire_date: formData.expireDate || null,
            };

            // Save product - create or update
            const isEditing = !!editProduct;
            const response = isEditing
                ? await productService.updateProduct(
                      editProduct.id as number,
                      productData as Partial<Product>,
                      itemImage.file,
                      itemImage.remove,
                  )
                : await productService.createProduct(productData as Partial<Product>, itemImage.file, itemImage.remove);

            if (!response.success) {
                // Handle validation errors for duplicates
                let errorMessage = '';
                if (response.errors) {
                    if (response.errors.name) {
                        errorMessage = t('product.validation.error_name', { error: response.errors.name[0] });
                    } else if (response.errors.image) {
                        errorMessage = response.errors.image[0];
                    } else if (response.errors.barcode) {
                        errorMessage = `${t('product.barcode')}: ${response.errors.barcode[0]}`;
                    } else if (response.errors.secondary_barcode) {
                        errorMessage = `${t('product.secondary_barcode')}: ${response.errors.secondary_barcode[0]}`;
                    } else {
                        errorMessage =
                            response.message ||
                            (isEditing
                                ? t('product.failed_update')
                                : t('product.failed_create'));
                    }
                } else {
                    errorMessage =
                        response.message ||
                        (isEditing
                            ? t('product.failed_update')
                            : t('product.failed_create'));
                }

                toast({
                    title: isEditing
                        ? t('product.update_failed')
                        : t('product.creation_failed'),
                    description: errorMessage,
                    type: 'error',
                });
                setError(errorMessage);
                return;
            }

            // Show success toast
            toast({
                title: isEditing
                    ? t('product.updated')
                    : t('product.created'),
                description: isEditing
                    ? t('product.updated_successfully', {
                          name: formData.name,
                      })
                    : t('product.created_successfully', {
                          name: formData.name,
                      }),
                type: 'success',
            });

            // Prepare the data to pass back for smart update
            const savedProductData = {
                ...(response.data || productData),
                id:
                    response.data?.id ||
                    (isEditing ? editProduct.id : undefined),
                category: selectedCategory,
                supplier: selectedSupplier,
            };

            // Reset form and close modal with saved data
            setFormData({
                name: '',
                categoryId: '',
                supplierId: '',
                barcodeType: 'ean13',
                barcode: '',
                secondaryBarcode: '',
                costPrice: '',
                sellPrice: '',
                stock: '',
                minStock: '',
                perCarton: '',
                cartonPrice: '',
                expireDate: '',
                showInPos: false,
            });
            setCartonPriceManuallyEdited(false);
            setBarcodeDetection(null);
            setShowBarcodeTypeSelection(false);
            onClose(savedProductData);
        } catch {
            toast({
                title: t('product.operation_failed'),
                description: t('product.unexpected_error'),
                type: 'error',
            });
            setError(t('product.failed_save'));
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            categoryId: '',
            supplierId: '',
            barcodeType: 'ean13',
            barcode: '',
            secondaryBarcode: '',
            costPrice: '',
            sellPrice: '',
            stock: '',
            minStock: '',
            perCarton: '',
            cartonPrice: '',
            expireDate: '',
            showInPos: false,
        });
        setCartonPriceManuallyEdited(false);
        setError(null);
        setSelectedCategory(null);
        setSelectedSupplier(null);
        setCategorySearchTerm('');
        setSupplierSearchTerm('');
        setCategoryDropdownOpen(false);
        setSupplierDropdownOpen(false);
        setBarcodeDetection(null);
        setShowBarcodeTypeSelection(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 [&>button]:hidden border-indigo-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-indigo-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                style={{
                    zIndex: 9999,
                    maxWidth: 'calc(100vw - 2rem)',
                    width: '1280px',
                }}
            >
                <DialogHeader className="shrink-0 border-b border-indigo-200 px-6 py-4 dark:border-indigo-800">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                            <Plus className="h-4 w-4 text-white" />
                        </div>
                        {editProduct
                            ? t('product.edit_product')
                            : t('product.add_new_product')}
                    </DialogTitle>
                </DialogHeader>

                <form
                    id="product-form"
                    onSubmit={handleSave}
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4 [&_input]:text-base [&_button[role=combobox]]:text-base"
                >
                    {/* Error Display */}
                    {error && (
                        <div className="rounded-md shadow-[0_0_0_1px_rgba(239,68,68,0.2)] bg-destructive/10 p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="grid content-start grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="name"
                                className="text-base font-semibold"
                            >
                                {t('product.product_name')} *
                            </Label>
                            <Input
                                id="name"
                                placeholder={t('product.product_name_placeholder')}
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange('name', e.target.value)
                                }
                                className="h-12"
                            />
                        </div>

                        {/* Category Search */}
                        <div className="relative space-y-2" ref={categoryRef}>
                            <Label
                                htmlFor="category"
                                className="text-base font-semibold"
                            >
                                {t('product.category')} *
                            </Label>
                            <div className="relative">
                                {selectedCategory ? (
                                    <div className="flex h-12 items-center justify-between rounded-md border border-input bg-background p-3 transition-colors hover:border-ring">
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
                                            placeholder={t('product.search_categories')}
                                            value={categorySearchTerm}
                                            onChange={(e) =>
                                                setCategorySearchTerm(
                                                    e.target.value,
                                                )
                                            }
                                            onFocus={() =>
                                                setCategoryDropdownOpen(true)
                                            }
                                            className="h-12 pr-10"
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
                                                {t('common.loading')}
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
                                                {t('product.no_categories_found')}
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
                                className="text-base font-semibold"
                            >
                                {t('product.supplier')} *
                            </Label>
                            <div className="relative">
                                {selectedSupplier ? (
                                    <div className="flex h-12 items-center justify-between rounded-md border border-input bg-background p-3 transition-colors hover:border-ring">
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
                                            placeholder={t('product.search_suppliers')}
                                            value={supplierSearchTerm}
                                            onChange={(e) =>
                                                setSupplierSearchTerm(
                                                    e.target.value,
                                                )
                                            }
                                            onFocus={() =>
                                                setSupplierDropdownOpen(true)
                                            }
                                            className="h-12 pr-10"
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
                                                {t('common.loading')}
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
                                                {t('product.no_suppliers_found')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Barcode Type */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="barcodeType"
                                className="text-base font-semibold"
                            >
                                {t('product.barcode_type')}
                            </Label>
                            <Select
                                value={formData.barcodeType}
                                onValueChange={(value: string) =>
                                    handleInputChange('barcodeType', value)
                                }
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue
                                        placeholder={t('product.select_barcode_type')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {BARCODE_TYPES.map((type) => (
                                        <SelectItem
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Barcode */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="barcode"
                                className="text-base font-semibold"
                            >
                                {t('product.barcode')} *
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="barcode"
                                    placeholder={t('product.barcode_placeholder')}
                                    value={formData.barcode}
                                    onChange={(e) =>
                                        handleBarcodeInputChange(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="h-12 flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-12 px-3"
                                    onClick={handleAutoGenerateBarcode}
                                    disabled={!formData.barcodeType}
                                    title={
                                        !formData.barcodeType
                                            ? t('product.select_barcode_type_first')
                                            : t('product.generate_barcode_auto')
                                    }
                                >
                                    {t('product.auto')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-12 px-3"
                                    onClick={handleBarcodePreview}
                                    disabled={!formData.barcode}
                                    title={
                                        !formData.barcode
                                            ? t('product.enter_generate_barcode_first')
                                            : t('product.preview_barcode')
                                    }
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Barcode Detection Results */}
                            {barcodeDetection?.detectedType && (
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
                                    <CheckCircle className="size-4 shrink-0 text-green-600" />
                                    <span>{t('product.detected')}: {barcodeDetection.detectedType.toUpperCase()}</span>
                                    {showBarcodeTypeSelection && (
                                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDetectedBarcodeTypeSelect(barcodeDetection.detectedType!)}>
                                            {t('product.use')}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Secondary Barcode */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="secondaryBarcode"
                                className="text-base font-semibold"
                            >
                                {t('product.secondary_barcode')}
                            </Label>
                            <Input
                                id="secondaryBarcode"
                                placeholder={t('product.secondary_barcode_placeholder')}
                                value={formData.secondaryBarcode}
                                onChange={(e) =>
                                    handleInputChange(
                                        'secondaryBarcode',
                                        e.target.value,
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                className="h-12"
                            />
                        </div>

                        {/* Cost Price */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="costPrice"
                                className="text-base font-semibold"
                            >
                                {t('product.cost_price')} ({getCurrencySymbol()})
                                *
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
                                className="h-12"
                            />
                        </div>

                        {/* Sell Price */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="sellPrice"
                                className="text-base font-semibold"
                            >
                                {t('product.sell_price')} ({getCurrencySymbol()})
                                *
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
                                className="h-12"
                            />
                        </div>

                        {/* Profit Margin (Auto) */}
                        {PRODUCT_ADVANCED_FIELDS_ENABLED && (<div className="space-y-2">
                            <Label
                                htmlFor="profitMargin"
                                className="text-base font-semibold"
                            >
                                {t('product.profit_margin_auto')}
                            </Label>
                            <Input
                                id="profitMargin"
                                value={`${profitMargin}%`}
                                readOnly
                                className="bg-muted"
                            />
                        </div>)}

                        {/* Stock */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="stock"
                                className="text-base font-semibold"
                            >
                                {t('product.stock_quantity')} *
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) =>
                                    handleInputChange('stock', e.target.value)
                                }
                                className="h-12"
                            />
                        </div>

                        {/* Min Stock (Auto 5) */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="minStock"
                                className="text-base font-semibold"
                            >
                                {t('product.minimum_stock_auto')} *
                            </Label>
                            <Input
                                id="minStock"
                                type="number"
                                placeholder="5"
                                value={formData.minStock}
                                onChange={(e) =>
                                    handleInputChange(
                                        'minStock',
                                        e.target.value,
                                    )
                                }
                                className="h-12"
                            />
                        </div>

                        {/* Per Carton */}
                        {PRODUCT_ADVANCED_FIELDS_ENABLED && (<div className="space-y-2">
                            <Label
                                htmlFor="perCarton"
                                className="text-base font-semibold"
                            >
                                {t('product.per_carton')}
                            </Label>
                            <Input
                                id="perCarton"
                                type="number"
                                placeholder={t('product.per_carton_placeholder')}
                                value={formData.perCarton}
                                onChange={(e) =>
                                    handleInputChange(
                                        'perCarton',
                                        e.target.value,
                                    )
                                }
                                className="h-12"
                            />
                        </div>)}

                        {/* Carton Price */}
                        {PRODUCT_ADVANCED_FIELDS_ENABLED && (<div className="space-y-2">
                            <Label
                                htmlFor="cartonPrice"
                                className="text-base font-semibold"
                            >
                                {t('product.carton_price')}
                            </Label>
                            <Input
                                id="cartonPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={t('product.carton_price_placeholder')}
                                value={formData.cartonPrice}
                                onChange={(e) =>
                                    handleCartonPriceChange(e.target.value)
                                }
                                className="h-12"
                            />
                        </div>)}

                        {/* Show in POS */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="showInPos"
                                className="text-base font-semibold"
                            >
                                {t('product.show_in_pos')}
                            </Label>
                            <div className="flex h-12 items-center justify-between rounded-md border border-input bg-background p-3 transition-colors hover:border-ring">
                                <div className="flex items-center space-x-3">
                                    <Switch
                                        id="showInPos"
                                        checked={formData.showInPos}
                                        onCheckedChange={(checked) =>
                                            handleInputChange(
                                                'showInPos',
                                                checked,
                                            )
                                        }
                                    />
                                </div>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs ${
                                        formData.showInPos
                                            ? 'border border-primary/20 bg-primary/10 text-primary'
                                            : 'border border-border bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {formData.showInPos
                                        ? t('common.on')
                                        : t('common.off')}
                                </span>
                            </div>
                        </div>

                        {/* Days Until Expire (Auto) */}
                        {PRODUCT_ADVANCED_FIELDS_ENABLED && (<div className="space-y-2">
                            <Label
                                htmlFor="daysUntilExpire"
                                className="text-base font-semibold"
                            >
                                {t('product.days_until_expire_auto')}
                            </Label>
                            <Input
                                id="daysUntilExpire"
                                value={`${daysUntilExpire} ${t('product.days')}`}
                                readOnly
                                className="bg-muted"
                            />
                        </div>)}

                        {/* Expire Date - New Row */}
                        {PRODUCT_ADVANCED_FIELDS_ENABLED && (<div className="space-y-2">
                            <Label
                                htmlFor="expireDate"
                                className="text-base font-semibold"
                            >
                                {t('product.expire_date')}
                            </Label>
                            <DatePicker
                                id="expireDate"
                                value={formData.expireDate}
                                onChange={(date) =>
                                    handleInputChange('expireDate', date)
                                }
                                placeholder={t('product.expire_date_placeholder')}
                                className="h-12"
                            />
                        </div>)}
                    </div>
                        <aside className="min-w-0">
                            <ItemImageField compact value={itemImage.file} remove={itemImage.remove} onChange={itemImage.change} disabled={saving} existingUrl={typeof editProduct?.image_url === 'string' ? editProduct.image_url : null} />
                        </aside>
                    </div>
                </form>

                <DialogFooter className="shrink-0 border-t border-indigo-200 px-6 py-4 dark:border-indigo-800 [&_button]:h-12 [&_button]:px-6 [&_button]:text-base">
                    <Button variant="outline" onClick={handleClose} className="border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-500 hover:bg-indigo-100 hover:text-indigo-800 focus:border-indigo-500 focus:bg-indigo-100 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-200 dark:focus:border-indigo-500 dark:focus:bg-indigo-900/30 dark:focus:ring-2 dark:focus:ring-indigo-400">
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" form="product-form" disabled={saving} className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 dark:focus:ring-2 dark:focus:ring-indigo-400">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editProduct
                                    ? t('product.updating')
                                    : t('product.saving')}
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {editProduct
                                    ? t('product.update_product')
                                    : t('product.add_product')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Barcode Preview Modal */}
            <BarcodePreviewModal
                isOpen={barcodePreviewOpen}
                onClose={() => setBarcodePreviewOpen(false)}
                barcode={formData.barcode}
                barcodeType={formData.barcodeType as BarcodeType}
            />
        </Dialog>
    );
}
