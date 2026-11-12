import { SCALE_PRODUCTS_ENABLED } from '@/config/features';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/currency';
import inventoryService, {
    type InventoryItem,
} from '@/services/business/inventoryService';
import { type Product } from '@/types';
import {
    purchaseService,
    type CreatePurchaseData,
} from '@/services/business/purchaseService';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import {
    Loader2,
    Package,
    Plus,
    Receipt,
    Scale,
    Search,
    ShoppingCart,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProductModal } from '@/components/modals/product-modal';

interface PurchaseItem {
    id: number;
    name: string;
    product_type: 'product' | 'scale_product';
    identifier: string; // barcode or PLU
    current_cost_price: number;
    current_sell_price: number;
    cost_price: number; // editable
    sell_price: number; // editable
    quantity: number;
    supplier_id?: number;
    supplier_name?: string;
    total_cost: number;
    profit_margin: number;
}

interface AddPurchaseModalProps {
    isOpen: boolean;
    onClose: (purchaseData?: CreatePurchaseData) => void;
    onSuccess?: () => void; // Callback for successful purchase creation/update
    editPurchase?: CreatePurchaseData & { id?: number }; // Purchase data for editing mode
}

export function AddPurchaseModal({
    isOpen,
    onClose,
    onSuccess,
    editPurchase,
}: AddPurchaseModalProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Refs
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    
    // Error sound refs (same as POS page)
    const errorAudioRefs = useRef<HTMLAudioElement[]>([]);
    const currentErrorAudioIndex = useRef(0);

    const [formData, setFormData] = useState({
        invoiceName: '',
        invoiceId: '',
    });

    // Purchase state
    const [productType, setProductType] = useState<'product' | 'scale_product'>(
        'product',
    );
    const [nameSearch, setNameSearch] = useState('');
    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [editingSupplierItemKey, setEditingSupplierItemKey] = useState<
        string | null
    >(null);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [prefillBarcode, setPrefillBarcode] = useState<string>('');
    const [scanError, setScanError] = useState(false);
    
    // Local cache for newly created products (to make them immediately searchable)
    const [recentlyCreatedProducts, setRecentlyCreatedProducts] = useState<Map<string, InventoryItem>>(new Map());

    // Purchase persistence constants
    const PURCHASE_ITEMS_STORAGE_KEY = 'purchase:items';
    const PURCHASE_FORM_STORAGE_KEY = 'purchase:form';

    // Purchase persistence utilities
    const savePurchaseToStorage = useCallback((items: PurchaseItem[], form: { invoiceName: string; invoiceId: string }) => {
        try {
            localStorage.setItem(PURCHASE_ITEMS_STORAGE_KEY, JSON.stringify(items));
            localStorage.setItem(PURCHASE_FORM_STORAGE_KEY, JSON.stringify(form));
        } catch {
            // Failed to save purchase to localStorage
        }
    }, [PURCHASE_ITEMS_STORAGE_KEY, PURCHASE_FORM_STORAGE_KEY]);

    const loadPurchaseFromStorage = useCallback((): { items: PurchaseItem[]; form: { invoiceName: string; invoiceId: string } } => {
        try {
            const savedItems = localStorage.getItem(PURCHASE_ITEMS_STORAGE_KEY);
            const savedForm = localStorage.getItem(PURCHASE_FORM_STORAGE_KEY);
            
            return {
                items: savedItems ? JSON.parse(savedItems) : [],
                form: savedForm ? JSON.parse(savedForm) : { invoiceName: '', invoiceId: '' }
            };
        } catch {
            return { items: [], form: { invoiceName: '', invoiceId: '' } };
        }
    }, [PURCHASE_ITEMS_STORAGE_KEY, PURCHASE_FORM_STORAGE_KEY]);

    const clearPurchaseFromStorage = useCallback(() => {
        try {
            localStorage.removeItem(PURCHASE_ITEMS_STORAGE_KEY);
            localStorage.removeItem(PURCHASE_FORM_STORAGE_KEY);
        } catch {
            // Failed to clear purchase from localStorage
        }
    }, [PURCHASE_ITEMS_STORAGE_KEY, PURCHASE_FORM_STORAGE_KEY]);

    // Shared backend search helper
    const searchBackend = useCallback(async (searchTerm: string): Promise<InventoryItem[]> => {
        if (!searchTerm.trim()) {
            return [];
        }

        try {
            const productTypeFilter = productType === 'product' ? 'normal' : 'scale';
            
            const response = await inventoryService.getInventoryItems(
                {
                    search: searchTerm.trim(),
                    productType: productTypeFilter,
                },
                1,
                15,
                false,
                true // minimalMode = true for add purchase modal
            );

            if (response.success && response.data) {
                const results = Array.isArray(response.data) ? response.data : [];
                
                // Filter out items already in purchase
                return results.filter((item) => {
                    return !purchaseItems.some(
                        (pItem) =>
                            pItem.id === item.id &&
                            pItem.product_type === item.product_type,
                    );
                });
            }
        } catch {
            // Error handled silently
        }

        return [];
    }, [productType, purchaseItems]);

    const performBackendSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await searchBackend(searchTerm);
            setSearchResults(results.slice(0, 10));
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, [searchBackend]);

    const loadSuppliers = useCallback(async () => {
        setLoadingSuppliers(true);
        try {
            const response = await supplierService.getSuppliers();
            if (response.success && response.data) {
                setSuppliers(response.data);
            }
        } catch {
            // Failed to load suppliers
        } finally {
            setLoadingSuppliers(false);
        }
    }, []);



    const searchInventoryItemsExact = useCallback(async (searchTerm: string): Promise<InventoryItem[]> => {
        if (!searchTerm.trim()) {
            return [];
        }

        const searchTermLower = searchTerm.trim().toLowerCase();

        // First, check purchase items (for newly created products that are already in cart)
        const purchaseItemResults: InventoryItem[] = [];
        purchaseItems.forEach((pItem) => {
            const itemIdentifier = (pItem.identifier || '').toLowerCase();
            const itemName = (pItem.name || '').toLowerCase();
            
            // Match by identifier (barcode) or name
            if (
                itemIdentifier === searchTermLower ||
                itemName.includes(searchTermLower)
            ) {
                // Check if product type matches
                if (productType === 'product' && pItem.product_type === 'product') {
                    // Convert PurchaseItem back to InventoryItem format
                    purchaseItemResults.push({
                        id: pItem.id,
                        name: pItem.name,
                        product_type: pItem.product_type,
                        identifier: pItem.identifier,
                        identifier_type: 'ean13',
                        barcode: pItem.identifier,
                        cost_price: pItem.cost_price,
                        sell_price: pItem.sell_price,
                        stock: 0,
                        status: 'active',
                        profit_margin: pItem.profit_margin,
                        profit_amount: pItem.sell_price - pItem.cost_price,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        supplier: pItem.supplier_name || undefined,
                        original_data: {
                            id: pItem.id,
                            name: pItem.name,
                            category_id: 0,
                            supplier_id: pItem.supplier_id || 0,
                            barcode_type: 'ean13',
                            barcode: pItem.identifier,
                            cost_price: pItem.cost_price,
                            sell_price: pItem.sell_price,
                            stock: 0,
                            min_stock: 5,
                            show_in_pos: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        } as Product,
                    });
                } else if (productType === 'scale_product' && pItem.product_type === 'scale_product') {
                    purchaseItemResults.push({
                        id: pItem.id,
                        name: pItem.name,
                        product_type: pItem.product_type,
                        identifier: pItem.identifier,
                        identifier_type: 'plu',
                        barcode: pItem.identifier,
                        cost_price: pItem.cost_price,
                        sell_price: pItem.sell_price,
                        stock: 0,
                        status: 'active',
                        profit_margin: pItem.profit_margin,
                        profit_amount: pItem.sell_price - pItem.cost_price,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        supplier: pItem.supplier_name || undefined,
                        original_data: {
                            id: pItem.id,
                            name: pItem.name,
                            category_id: 0,
                            supplier_id: pItem.supplier_id || 0,
                            barcode_type: 'ean13',
                            barcode: pItem.identifier,
                            cost_price: pItem.cost_price,
                            sell_price: pItem.sell_price,
                            stock: 0,
                            min_stock: 5,
                            show_in_pos: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        } as Product,
                    });
                }
            }
        });

        // If found in purchase items, return them
        if (purchaseItemResults.length > 0) {
            return purchaseItemResults;
        }

        // Check recently created products cache (immediate lookup by key)
        // First try direct key lookup for fastest access
        const directCacheHit = recentlyCreatedProducts.get(searchTermLower);
        if (directCacheHit) {
            // Check if product type matches
            if (productType === 'product' && directCacheHit.product_type === 'product') {
                return [directCacheHit];
            } else if (productType === 'scale_product' && directCacheHit.product_type === 'scale_product') {
                return [directCacheHit];
            }
        }
        
        // Fallback: iterate through cache for partial matches (barcode, identifier, secondary_barcode)
        const cachedResults: InventoryItem[] = [];
        recentlyCreatedProducts.forEach((item) => {
            const itemBarcode = (item.barcode || '').toLowerCase();
            const itemIdentifier = (item.identifier || '').toLowerCase();
            const itemSecondaryBarcode = (item.secondary_barcode || '').toLowerCase();
            
            // Match by barcode, identifier, or secondary barcode
            if (
                itemBarcode === searchTermLower ||
                itemIdentifier === searchTermLower ||
                itemSecondaryBarcode === searchTermLower
            ) {
                // Check if product type matches
                if (productType === 'product' && item.product_type === 'product') {
                    cachedResults.push(item);
                } else if (productType === 'scale_product' && item.product_type === 'scale_product') {
                    cachedResults.push(item);
                }
            }
        });

        // If found in cache, return cached results
        if (cachedResults.length > 0) {
            return cachedResults;
        }

        // If not found locally, search backend
        return await searchBackend(searchTerm);
    }, [productType, purchaseItems, recentlyCreatedProducts, searchBackend]);

    useEffect(() => {
        if (searchDebounceTimer.current) {
            clearTimeout(searchDebounceTimer.current);
        }

        const nameSearchTerm = String(nameSearch || '').trim();
        const barcodeSearchTerm = String(barcodeSearch || '').trim();

            if (!nameSearchTerm && !barcodeSearchTerm) {
                setSearchResults([]);
                return;
            }

        const combinedSearch = barcodeSearchTerm || nameSearchTerm;

        // Debounce: immediate for barcode (exact match), 300ms for name search
        const debounceTime = barcodeSearchTerm ? 0 : 300;

        searchDebounceTimer.current = setTimeout(() => {
            performBackendSearch(combinedSearch);
        }, debounceTime);

        return () => {
            if (searchDebounceTimer.current) {
                clearTimeout(searchDebounceTimer.current);
            }
        };
    }, [nameSearch, barcodeSearch, productType, performBackendSearch]);

    const addToPurchase = (item: InventoryItem) => {
        try {
            const newPurchaseItem: PurchaseItem = {
                id: item.id,
                name: String(item.name || t('add_purchase_modal.unknown_product')),
                product_type: item.product_type as 'product' | 'scale_product',
                identifier: String(item.identifier || ''),
                current_cost_price: Number(item.cost_price || 0),
                current_sell_price: Number(item.sell_price || 0),
                cost_price: Number(item.cost_price || 0),
                sell_price: Number(item.sell_price || 0),
                quantity: 1,
                supplier_id: (item.original_data as Record<string, unknown>)
                    ?.supplier_id as number | undefined,
                supplier_name:
                    typeof item.supplier === 'object'
                        ? (item.supplier as { name?: string })?.name || ''
                        : String(item.supplier || ''),
                total_cost: Number(item.cost_price || 0),
                profit_margin: calculateProfitMargin(
                    Number(item.cost_price || 0),
                    Number(item.sell_price || 0),
                ),
            };

            setPurchaseItems(prev => [...prev, newPurchaseItem]);
        } catch {
            toast({
                type: 'error',
                title: t('add_purchase_modal.error'),
                description: t('add_purchase_modal.failed_to_add_item'),
            });
        }
    };

    const removeFromPurchase = (itemId: number, productType: string) => {
        setPurchaseItems((prev) =>
            prev.filter(
                (item) =>
                    !(item.id === itemId && item.product_type === productType),
            ),
        );

        const key = getItemKey(itemId, productType);
        if (editingSupplierItemKey === key) {
            closeSupplierSearch();
        }
    };
    const updatePurchaseItem = (
        itemId: number,
        productType: string,
        field: string,
        value: string | number | undefined,
    ) => {
        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId && item.product_type === productType) {
                    const updatedItem = { ...item, [field]: value };

                    // Recalculate totals
                    if (field === 'cost_price' || field === 'quantity') {
                        updatedItem.total_cost =
                            updatedItem.cost_price * updatedItem.quantity;
                    }

                    // Recalculate profit margin
                    if (field === 'cost_price' || field === 'sell_price') {
                        updatedItem.profit_margin = calculateProfitMargin(
                            updatedItem.cost_price,
                            updatedItem.sell_price,
                        );
                    }

                    return updatedItem;
                }
                return item;
            }),
        );
    };

    const calculateProfitMargin = (
        costPrice: number,
        sellPrice: number,
    ): number => {
        if (costPrice > 0 && sellPrice > 0) {
            return ((sellPrice - costPrice) / costPrice) * 100;
        }
        return 0;
    };

    const getItemKey = (itemId: number, productType: string) =>
        `${productType}-${itemId}`;

    // Start editing supplier for specific item
    const startEditingSupplier = (itemId: number, productType: string) => {
        const key = getItemKey(itemId, productType);
        setEditingSupplierItemKey(key);
        setSupplierSearchTerm('');
    };

    const clearSupplierSelection = (itemId: number, productType: string) => {
        startEditingSupplier(itemId, productType);
    };

    // Select supplier for current editing item
    const selectSupplier = (supplier: Supplier) => {
        if (editingSupplierItemKey) {
            const [productType, itemId] = editingSupplierItemKey.split('-');
            updatePurchaseItem(
                parseInt(itemId),
                productType,
                'supplier_id',
                supplier.id,
            );
            updatePurchaseItem(
                parseInt(itemId),
                productType,
                'supplier_name',
                supplier.name,
            );
            closeSupplierSearch();
        }
    };

    // Close supplier search
    const closeSupplierSearch = (open?: boolean) => {
        if (open === false || open === undefined) {
            setEditingSupplierItemKey(null);
            setSupplierSearchTerm('');
        }
    };

    const filteredSuppliers = suppliers.filter(
        (supplier) =>
            String(supplier.name || '')
                .toLowerCase()
                .includes(String(supplierSearchTerm || '').toLowerCase()) ||
            String(supplier.supplier_code || '')
                .toLowerCase()
                .includes(String(supplierSearchTerm || '').toLowerCase()),
    );

    const totalOrders = purchaseItems.length;
    const totalAmount = purchaseItems.reduce(
        (sum, item) => sum + Number(item.total_cost || 0),
        0,
    );

    const firstProductSupplierName = purchaseItems.length > 0 
        ? purchaseItems[0].supplier_name || '' 
        : '';

    useEffect(() => {
        if (formData.invoiceId.trim() && firstProductSupplierName) {
            setFormData(prevForm => ({
                ...prevForm,
                invoiceName: `${firstProductSupplierName} + ${formData.invoiceId}`,
            }));
        } else if (!formData.invoiceId.trim()) {
            setFormData(prevForm => ({
                ...prevForm,
                invoiceName: '',
            }));
        }
    }, [formData.invoiceId, firstProductSupplierName]);

    const handleFormChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Prevent duplicate submissions
        if (saving) return;

        // Validation
        if (!formData.invoiceName.trim()) {
            setError(t('add_purchase_modal.invoice_name_required'));
            return;
        }

        if (!formData.invoiceId.trim()) {
            setError(t('add_purchase_modal.invoice_id_required'));
            return;
        }

        if (purchaseItems.length === 0) {
            setError(t('add_purchase_modal.at_least_one_product_required'));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            let response;

            if (editPurchase) {
                // Validate that we have a valid ID for editing
                if (!editPurchase.id) {
                    throw new Error(t('add_purchase_modal.purchase_id_required_for_editing'));
                }

                const updateData = {
                    invoice_name: formData.invoiceName,
                    invoice_id: formData.invoiceId,
                    notes: `Purchase with ${totalOrders} items, total amount: ${formatCurrency(totalAmount)}`,
                    items: purchaseItems.map((item) => {
                        // Validate required fields
                        if (!item.id || item.id === 0) {
                            throw new Error(
                                `Invalid product ID for item: ${item.name}`,
                            );
                        }
                        if (
                            !item.product_type ||
                            !['product', 'scale_product'].includes(
                                item.product_type,
                            )
                        ) {
                            throw new Error(
                                `Invalid product type for item: ${item.name}`,
                            );
                        }
                        if (!item.name || item.name.trim() === '') {
                            throw new Error(
                                `Product name is required for item with ID: ${item.id}`,
                            );
                        }
                        if (!item.identifier || item.identifier.trim() === '') {
                            throw new Error(
                                `Identifier is required for item: ${item.name}`,
                            );
                        }
                        if (
                            item.cost_price < 0 ||
                            item.sell_price < 0 ||
                            item.quantity <= 0
                        ) {
                            throw new Error(
                                `Invalid price or quantity for item: ${item.name}`,
                            );
                        }

                        return {
                            product_id: item.id,
                            product_type: item.product_type,
                            product_name: item.name,
                            identifier: item.identifier,
                            cost_price: Number(item.cost_price),
                            sell_price: Number(item.sell_price),
                            quantity: Number(item.quantity),
                            supplier_id:
                                item.supplier_id && item.supplier_id > 0
                                    ? item.supplier_id
                                    : undefined,
                            supplier_name: item.supplier_name || undefined,
                        };
                    }),
                };

                response = await purchaseService.updatePurchase(
                    editPurchase.id,
                    updateData,
                );
            } else {
                // Create new purchase
                const purchaseData: CreatePurchaseData = {
                    invoice_name: formData.invoiceName,
                    invoice_id: formData.invoiceId,
                    notes: `Purchase with ${totalOrders} items, total amount: ${formatCurrency(totalAmount)}`,
                    items: purchaseItems.map((item) => ({
                        product_id: item.id,
                        product_type: item.product_type,
                        product_name: item.name,
                        identifier: item.identifier,
                        cost_price: item.cost_price,
                        sell_price: item.sell_price,
                        quantity: item.quantity,
                        supplier_id: item.supplier_id,
                        supplier_name: item.supplier_name || '',
                    })),
                };

                response = await purchaseService.createPurchase(purchaseData);
            }

            if (response.success) {
                // Show success toast
                toast({
                    title: editPurchase
                        ? t('add_purchase_modal.purchase_updated')
                        : t('add_purchase_modal.purchase_created'),
                    description: `Purchase "${formData.invoiceName}" with ${totalOrders} items has been ${editPurchase ? 'updated' : 'created'} successfully.`,
                    type: 'success',
                });

                // Call success callback if provided
                if (onSuccess) {
                    onSuccess();
                }

                handleCompleteClear();
                onClose();
            } else {
                // Handle validation errors
                if (response.errors) {
                    const firstError = Object.values(response.errors)[0]?.[0];
                    setError(
                        String(
                            firstError ||
                                response.message ||
                                t('add_purchase_modal.validation_failed'),
                        ),
                    );
                } else {
                    setError(
                        String(
                            response.message ||
                                `Failed to ${editPurchase ? 'update' : 'create'} purchase`,
                        ),
                    );
                }

                toast({
                    title: t(`add_purchase_modal.${editPurchase ? 'update' : 'creation'}_failed`),
                    description: String(
                        response.message ||
                            `Failed to ${editPurchase ? 'update' : 'create'} purchase.`,
                    ),
                    type: 'error',
                });
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast({
                title: t(`add_purchase_modal.${editPurchase ? 'update' : 'creation'}_failed`),
                description: String(
                    err.message || t('add_purchase_modal.unexpected_error'),
                ),
                type: 'error',
            });
            setError(
                String(
                    err.message ||
                        `Failed to ${editPurchase ? 'update' : 'create'} purchase`,
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    // Handle close - preserve purchase items and form data, only clear search states
    const handleClose = () => {
        // Only clear search states and error, preserve purchase items and form data
        setNameSearch('');
        setBarcodeSearch('');
        setSearchResults([]);
        setProductType('product');
        setError(null);
        closeSupplierSearch();
        // Clear cache on close to ensure fresh data on next open
        setRecentlyCreatedProducts(new Map());
        // Don't clear purchase items, form data, or localStorage - they should persist
        onClose();
    };

    // Handle complete clear - clear all data including purchase items and form data
    const handleCompleteClear = () => {
        setFormData({ invoiceName: '', invoiceId: '' });
        setPurchaseItems([]);
        setNameSearch('');
        setBarcodeSearch('');
        setSearchResults([]);
        setProductType('product');
        setError(null);
        closeSupplierSearch();
        setRecentlyCreatedProducts(new Map()); // Clear cache on complete clear
        clearPurchaseFromStorage();
    };

    // Helper function to focus barcode input
    // Handle product modal close - auto-add to purchase list when product is created
    const handleProductModalClose = (updatedData?: Record<string, unknown>) => {
        setProductModalOpen(false);
        setPrefillBarcode('');
        
        // Refocus barcode input after modal closes (DOM-based, same as POS page)
        setTimeout(() => {
            // Try ref-based approach first
            barcodeInputRef.current?.focus();
            // Also try direct DOM query as fallback (more reliable)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const barcodeInput = document.querySelector('[data-testid="purchase-barcode-search"]') as HTMLInputElement;
                    if (barcodeInput) {
                        barcodeInput.focus();
                    }
                });
            });
        }, 100);
        
        if (updatedData && updatedData.id) {
            // Product was created - clear barcode to allow next scan
            setBarcodeSearch('');
            // Product was created/updated - automatically add to purchase cart
            try {
                const productId = updatedData.id as number;
                
                // Only add if it's a regular product (not scale product) and matches current product type
                if (productType === 'product' && productId) {
                    // Check if product is already in purchase items
                    const alreadyAdded = purchaseItems.some(
                        (item) => item.id === productId && item.product_type === 'product'
                    );
                    
                    if (alreadyAdded) {
                        toast({
                            title: t('add_purchase_modal.product_added'),
                            description: t('add_purchase_modal.product_already_in_cart'),
                            type: 'info',
                        });
                        return;
                    }
                    
                    // Convert product data directly to InventoryItem format (no search needed)
                    // Use data from ProductModal response directly
                    const productBarcode = String(updatedData.barcode || '');
                    const costPrice = Number(updatedData.cost_price || 0);
                    const sellPrice = Number(updatedData.sell_price || 0);
                    const stock = Number(updatedData.stock || 0);
                    
                    // Calculate profit margin
                    const profitMargin = costPrice > 0 && sellPrice > 0
                        ? ((sellPrice - costPrice) / costPrice) * 100
                        : 0;
                    
                    // Get category name
                    const categoryName = typeof updatedData.category === 'object' && updatedData.category
                        ? (updatedData.category as { name?: string })?.name || ''
                        : String(updatedData.category || '');
                    
                    // Get supplier info
                    const supplierObj = typeof updatedData.supplier === 'object' && updatedData.supplier
                        ? (updatedData.supplier as { name?: string; id?: number; created_at?: string; updated_at?: string })
                        : null;
                    const supplierName = supplierObj?.name || String(updatedData.supplier || '');
                    const supplierId = supplierObj?.id;
                    
                    // Format supplier to match expected type
                    const supplier: string | { id: number; name: string; created_at: string; updated_at: string } | undefined = 
                        supplierObj && supplierObj.id && supplierObj.name
                            ? {
                                id: supplierObj.id,
                                name: supplierObj.name,
                                created_at: supplierObj.created_at || new Date().toISOString(),
                                updated_at: supplierObj.updated_at || new Date().toISOString(),
                            }
                            : supplierName || undefined;
                    
                    const inventoryItem: InventoryItem = {
                        id: productId,
                        name: String(updatedData.name || ''),
                        product_type: 'product',
                        identifier: productBarcode,
                        identifier_type: String(updatedData.barcode_type || 'ean13'),
                        barcode: productBarcode,
                        secondary_barcode: updatedData.secondary_barcode ? String(updatedData.secondary_barcode) : undefined,
                        category: categoryName || undefined,
                        supplier: supplier,
                        cost_price: costPrice,
                        sell_price: sellPrice,
                        stock: stock,
                        min_stock: Number(updatedData.min_stock || 5),
                        per_carton: updatedData.per_carton ? Number(updatedData.per_carton) : undefined,
                        carton_price: updatedData.carton_price ? Number(updatedData.carton_price) : null,
                        status: 'active',
                        profit_margin: profitMargin,
                        profit_amount: sellPrice - costPrice,
                        created_at: String(updatedData.created_at || new Date().toISOString()),
                        updated_at: String(updatedData.updated_at || new Date().toISOString()),
                        original_data: {
                            id: productId,
                            name: String(updatedData.name || ''),
                            category_id: typeof updatedData.category === 'object' && updatedData.category && 'id' in updatedData.category
                                ? Number((updatedData.category as { id?: number }).id || 0)
                                : 0,
                            supplier_id: supplierId || (typeof updatedData.supplier_id === 'number' ? updatedData.supplier_id : 0),
                            barcode_type: String(updatedData.barcode_type || 'ean13'),
                            barcode: productBarcode,
                            secondary_barcode: updatedData.secondary_barcode ? String(updatedData.secondary_barcode) : undefined,
                            cost_price: costPrice,
                            sell_price: sellPrice,
                            stock: stock,
                            min_stock: Number(updatedData.min_stock || 5),
                            show_in_pos: updatedData.show_in_pos !== undefined ? Boolean(updatedData.show_in_pos) : true,
                            expire_date: updatedData.expire_date ? String(updatedData.expire_date) : undefined,
                            last_sold_at: updatedData.last_sold_at ? String(updatedData.last_sold_at) : undefined,
                            created_at: String(updatedData.created_at || new Date().toISOString()),
                            updated_at: String(updatedData.updated_at || new Date().toISOString()),
                            category: typeof updatedData.category === 'object' && updatedData.category
                                ? (updatedData.category as { id?: number; name?: string })
                                : undefined,
                            supplier: supplierObj && supplierObj.id && supplierObj.name
                                ? { id: supplierObj.id, name: supplierObj.name }
                                : undefined,
                        } as Product,
                    };
                    
                    // STEP 1: Add to cache IMMEDIATELY (before any other operations)
                    // This ensures the product is searchable right away
                    setRecentlyCreatedProducts((prev) => {
                        const newMap = new Map(prev);
                        // Add with primary barcode key
                        if (productBarcode) {
                            newMap.set(productBarcode.toLowerCase(), inventoryItem);
                        }
                        // Also add with product ID as fallback key
                        newMap.set(String(productId), inventoryItem);
                        // Add with secondary barcode if it exists
                        if (inventoryItem.secondary_barcode) {
                            newMap.set(inventoryItem.secondary_barcode.toLowerCase(), inventoryItem);
                        }
                        return newMap;
                    });
                    
                    // STEP 2: Invalidate search cache by clearing search results
                    // This forces fresh search that will use the new cache entry
                    setSearchResults([]);
                    
                    // STEP 3: Add to purchase cart
                    addToPurchase(inventoryItem);
                    
                    toast({
                        title: t('add_purchase_modal.product_added'),
                        description: t('add_purchase_modal.product_added_to_purchase'),
                        type: 'success',
                    });
                } else if (productType === 'scale_product') {
                    // User is looking for scale products, but created a regular product
                    toast({
                        title: t('add_purchase_modal.product_added'),
                        description: t('add_purchase_modal.switch_to_normal_product_to_add'),
                        type: 'info',
                    });
                }
            } catch (error) {
                console.error('Failed to add product to purchase:', error);
                toast({
                    title: t('add_purchase_modal.product_added'),
                    description: t('add_purchase_modal.product_created_but_not_added'),
                    type: 'success',
                });
            }
        }
    };

    useEffect(() => {
        try {
            for (let i = 0; i < 3; i++) {
                const audio = new Audio('/audio/sounds/error-scan.mp3');
                audio.volume = 1.0;
                audio.preload = 'auto';
                audio.load();
                errorAudioRefs.current.push(audio);
            }
        } catch {
            // Silent fail
        }
    }, []);

    // Play error sound (same as POS page)
    const playErrorSound = useCallback(() => {
        if (errorAudioRefs.current.length > 0) {
            try {
                const audio = errorAudioRefs.current[currentErrorAudioIndex.current];
                audio.currentTime = 0;
                audio.play().catch(() => {});
                currentErrorAudioIndex.current = (currentErrorAudioIndex.current + 1) % errorAudioRefs.current.length;
            } catch {
                // Silent fail
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadSuppliers();
            setSearchResults([]);
            setNameSearch('');
            setBarcodeSearch('');
            // Keep cache when modal opens - newly created products should remain searchable
        }
    }, [isOpen, loadSuppliers]);

    useEffect(() => {
        if (isOpen) {
            setSearchResults([]);
            setNameSearch('');
            setBarcodeSearch('');
        }
    }, [productType, isOpen]);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editPurchase) {
                // Edit mode - populate form with existing purchase data
                setFormData({
                    invoiceName: editPurchase.invoice_name || '',
                    invoiceId: editPurchase.invoice_id || '',
                });

                // Convert existing items to purchase items format
                if (editPurchase.items && editPurchase.items.length > 0) {
                    const existingItems: PurchaseItem[] =
                        editPurchase.items.map(
                            (item: Record<string, unknown>) => {
                                const costPrice = Number(item.cost_price) || 0;
                                const sellPrice = Number(item.sell_price) || 0;
                                const quantity = Number(item.quantity) || 0;
                                const totalCost =
                                    Number(item.total_cost) ||
                                    costPrice * quantity;

                                let profitMargin =
                                    Number(item.profit_margin) || 0;
                                if (
                                    !profitMargin &&
                                    costPrice > 0 &&
                                    sellPrice > 0
                                ) {
                                    profitMargin =
                                        ((sellPrice - costPrice) / costPrice) *
                                        100;
                                }

                                return {
                                    id: Number(item.product_id) || 0,
                                    name: String(item.product_name || ''),
                                    product_type:
                                        (item.product_type as
                                            | 'product'
                                            | 'scale_product') || 'product',
                                    identifier: String(item.identifier || ''),
                                    current_cost_price: costPrice,
                                    current_sell_price: sellPrice,
                                    cost_price: costPrice,
                                    sell_price: sellPrice,
                                    quantity: quantity,
                                    supplier_id: Number(item.supplier_id) || 0,
                                    supplier_name: String(
                                        item.supplier_name || '',
                                    ),
                                    total_cost: totalCost,
                                    profit_margin: profitMargin,
                                };
                            },
                        );
                    setPurchaseItems(existingItems);
                }
            } else {
                setFormData({
                    invoiceName: '',
                    invoiceId: '',
                });
                setPurchaseItems([]);
            }
            setError(null);
        }
    }, [isOpen, editPurchase]);

    // Focus barcode input when modal opens (DOM-based, same as POS page)
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                // Try ref-based approach first
                barcodeInputRef.current?.focus();
                // Also try direct DOM query as fallback (more reliable)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const barcodeInput = document.querySelector('[data-testid="purchase-barcode-search"]') as HTMLInputElement;
                        if (barcodeInput) {
                            barcodeInput.focus();
                        }
                    });
                });
            }, 100);
        }
    }, [isOpen]);

    // Refocus barcode input when product modal closes (DOM-based, same as POS page)
    useEffect(() => {
        if (!productModalOpen && isOpen) {
            setTimeout(() => {
                // Try ref-based approach first
                barcodeInputRef.current?.focus();
                // Also try direct DOM query as fallback (more reliable)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const barcodeInput = document.querySelector('[data-testid="purchase-barcode-search"]') as HTMLInputElement;
                        if (barcodeInput) {
                            barcodeInput.focus();
                        }
                    });
                });
            }, 200);
        }
    }, [productModalOpen, isOpen]);

    useEffect(() => {
        if (isOpen && !editPurchase) {
            const { items, form } = loadPurchaseFromStorage();
            if (items.length > 0) {
                setPurchaseItems(items);
            }
            if (form.invoiceName || form.invoiceId) {
                setFormData(form);
            }
        }
    }, [isOpen, editPurchase, loadPurchaseFromStorage]);

    useEffect(() => {
        if (isOpen && !editPurchase && (purchaseItems.length > 0 || formData.invoiceName || formData.invoiceId)) {
            savePurchaseToStorage(purchaseItems, formData);
        }
    }, [purchaseItems, formData, isOpen, editPurchase, savePurchaseToStorage]);

    return (
        <>
            {/* Red Overlay for Error Feedback (same as POS page) */}
            {scanError && (
                <div className="fixed inset-0 z-[10000] bg-red-500/30 dark:bg-red-600/40 pointer-events-none animate-pulse" 
                     style={{ animation: 'pulse 0.5s ease-in-out' }} />
            )}

            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent
                    className="flex max-h-[90vh] flex-col overflow-hidden [&>button]:hidden border-green-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-green-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)]"
                    style={{
                        zIndex: 9999,
                        maxWidth: '75vw',
                        width: '1100px',
                    }}
                    hideClose
                >
                    <DialogHeader className="border-b border-green-200 pb-4 dark:border-green-800">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-green-800 dark:text-green-200">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                                        <ShoppingCart className="h-4 w-4 text-white" />
                                    </div>
                                    {editPurchase
                                        ? t('add_purchase_modal.edit_purchase')
                                        : t('add_purchase_modal.add_new_purchase')}
                                </DialogTitle>
                                
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPrefillBarcode('');
                                    setProductModalOpen(true);
                                }}
                                className="ml-4 h-9 gap-2 border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-500 hover:bg-indigo-100 hover:text-indigo-800 focus:border-indigo-500 focus:bg-indigo-100 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-200 dark:focus:border-indigo-500 dark:focus:bg-indigo-900/30 dark:focus:ring-2 dark:focus:ring-indigo-400"
                                tabIndex={-1}
                            >
                                <Plus className="h-4 w-4" />
                                {t('add_purchase_modal.add_product_button')}
                            </Button>
                        </div>
                    </DialogHeader>

                    <form
                        id="purchase-form"
                        onSubmit={handleSave}
                        className="flex flex-1 flex-col gap-6 overflow-hidden"
                    >
                        {/* Error Display */}
                        {error && (
                            <div className="rounded-md shadow-[0_0_0_1px_rgba(239,68,68,0.2)] bg-destructive/10 p-3">
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Invoice Details */}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="space-y-2 p-2">
                                <Label
                                    htmlFor="invoiceId"
                                    className="text-sm font-medium text-green-700 dark:text-green-300"
                                >
                                    {t('add_purchase_modal.invoice_id_label')}
                                </Label>
                                <Input
                                    id="invoiceId"
                                    placeholder={t('add_purchase_modal.enter_invoice_id')}
                                    value={formData.invoiceId}
                                    onChange={(e) =>
                                        handleFormChange(
                                            'invoiceId',
                                            e.target.value,
                                        )
                                    }
                                    className="h-11 border-green-300 bg-green-50 focus:border-green-500 focus:bg-green-100 focus:ring-2 focus:ring-green-200 dark:border-green-600 dark:bg-green-900/20 dark:focus:border-green-500 dark:focus:bg-green-900/30 dark:focus:ring-green-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2 p-2">
                                <Label
                                    htmlFor="invoiceName"
                                    className="text-sm font-medium text-green-700 dark:text-green-300"
                                >
                                    {t('add_purchase_modal.invoice_name_label')}
                                </Label>
                                <Input
                                    id="invoiceName"
                                    placeholder={t('add_purchase_modal.enter_invoice_name')}
                                    value={formData.invoiceName}
                                    disabled
                                    readOnly
                                    className="h-11 border-green-300 bg-green-50 focus:border-green-500 focus:bg-green-100 focus:ring-2 focus:ring-green-200 dark:border-green-600 dark:bg-green-900/20 dark:focus:border-green-500 dark:focus:bg-green-900/30 dark:focus:ring-green-400 cursor-not-allowed opacity-70"
                                    required
                                />
                            </div>

                            <div className="space-y-2 p-2">
                                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                                    {t('add_purchase_modal.total_orders_label')}
                                </Label>
                                <div className="flex h-11 items-center rounded-md border border-green-300 bg-green-50 px-3 dark:border-green-600 dark:bg-green-900/20">
                                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                        {totalOrders}{t('add_purchase_modal.items_suffix')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 p-2">
                                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                                    {t('add_purchase_modal.total_amount_label')}
                                </Label>
                                <div className="flex h-11 items-center rounded-md border border-green-300 bg-green-50 px-3 dark:border-green-600 dark:bg-green-900/20">
                                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Product Search */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="space-y-2 p-2">
                                    <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                                        {t('add_purchase_modal.product_type_label')}
                                    </Label>
                                    <Select
                                        value={productType}
                                        onValueChange={(
                                            value: 'product' | 'scale_product',
                                        ) => {
                                            setProductType(value);
                                            setNameSearch('');
                                            setBarcodeSearch('');
                                            setSearchResults([]);
                                        }}
                                    >
                                        <SelectTrigger className="w-40 h-11 border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-green-600 dark:bg-green-900/20 dark:focus:border-green-500 dark:focus:ring-green-400">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="product">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4" />
                                                    {t('add_purchase_modal.normal_product')}
                                                </div>
                                            </SelectItem>
                                            {SCALE_PRODUCTS_ENABLED && (<SelectItem value="scale_product">
                                                <div className="flex items-center gap-2">
                                                    <Scale className="h-4 w-4" />
                                                    {t('add_purchase_modal.scale_product')}
                                                </div>
                                            </SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex-1 space-y-2 p-2">
                                    <Label className="text-sm font-medium">
                                        {t('add_purchase_modal.search_products_label')}
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder={t('add_purchase_modal.search_by_name_placeholder')}
                                                value={nameSearch}
                                                onChange={(e) => {
                                                    setNameSearch(
                                                        e.target.value,
                                                    );
                                                }}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        // Auto-select first result on Enter
                                                        if (searchResults.length > 0) {
                                                            addToPurchase(searchResults[0]);
                                                            setNameSearch('');
                                                            setSearchResults([]);
                                                        } else if (nameSearch.trim()) {
                                                            // If no results but search term exists, try backend search
                                                            await performBackendSearch(nameSearch.trim());
                                                        }
                                                    }
                                                }}
                                                className="h-11 pl-10"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                ref={barcodeInputRef}
                                                data-testid="purchase-barcode-search"
                                                placeholder={
                                                    productType === 'product'
                                                        ? t('add_purchase_modal.search_by_barcode_placeholder')
                                                        : t('add_purchase_modal.search_by_plu_placeholder')
                                                }
                                                value={barcodeSearch}
                                                onChange={(e) => {
                                                    setBarcodeSearch(
                                                        e.target.value,
                                                    );
                                                }}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        
                                                        const currentBarcodeSearch = barcodeSearch.trim();
                                                        if (currentBarcodeSearch) {
                                                            // Use backend search API for exact barcode matching
                                                            const freshResults = await searchInventoryItemsExact(currentBarcodeSearch);
                                                            
                                                            if (freshResults.length === 1) {
                                                                // Single product found - add to purchase list
                                                                addToPurchase(freshResults[0]);
                                                                setBarcodeSearch('');
                                                                setSearchResults([]);
                                                            } else if (freshResults.length === 0) {
                                                                playErrorSound();
                                                                setScanError(true);
                                                                setPrefillBarcode(currentBarcodeSearch);
                                                                // Keep barcode value in input (don't clear it)
                                                                setTimeout(() => {
                                                                    setSearchResults([]);
                                                                    setScanError(false);
                                                                    setProductModalOpen(true);
                                                                }, 500);
                                                            } else if (freshResults.length > 1) {
                                                                // Multiple products - add first one
                                                                addToPurchase(freshResults[0]);
                                                                setBarcodeSearch('');
                                                                setSearchResults([]);
                                                            }
                                                        }
                                                    }
                                                }}
                                                className="h-11 pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search Results */}
                            {searching && (
                                <div className="flex items-center justify-center rounded-md border border-primary/20 bg-primary/5 p-4 dark:border-primary/80 dark:bg-primary/95/20">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {t('add_purchase_modal.searching')}
                                    </span>
                                </div>
                            )}
                            {!searching && searchResults.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-md border border-primary/20 bg-primary/5 p-2 dark:border-primary/80 dark:bg-primary/95/20">
                                    <div className="mb-2 text-sm font-medium">
                                        {t('add_purchase_modal.search_results_header')}
                                    </div>
                                    <div className="space-y-1">
                                        {searchResults.map((item) => {
                                            const itemName = String(
                                                item?.name || t('add_purchase_modal.unknown_product'),
                                            );
                                            const itemIdentifier = String(
                                                item?.identifier || 'N/A',
                                            );
                                            const itemSupplier =
                                                typeof item?.supplier ===
                                                'object'
                                                    ? String(
                                                          (
                                                              item?.supplier as {
                                                                  name?: string;
                                                              }
                                                          )?.name ||
                                                              t('add_purchase_modal.no_supplier'),
                                                      )
                                                    : String(
                                                          item?.supplier ||
                                                              t('add_purchase_modal.no_supplier'),
                                                      );
                                            const itemCost = Number(
                                                item?.cost_price || 0,
                                            );
                                            const itemStock = Number(
                                                item?.stock || 0,
                                            );
                                            const itemId = item?.id || 0;
                                            const itemType =
                                                item?.product_type || 'product';

                                            return (
                                                <div
                                                    key={`search-${itemType}-${itemId}`}
                                                    className="flex cursor-pointer items-center justify-between rounded border bg-background p-2 hover:bg-muted/50"
                                                    onClick={() =>
                                                        addToPurchase(item)
                                                    }
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {itemType ===
                                                        'scale_product' ? (
                                                            <Scale className="h-4 w-4 text-orange-500" />
                                                        ) : (
                                                            <Package className="h-4 w-4 text-[#1F3F3F]/50" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium">
                                                                {itemName}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {itemType ===
                                                                'scale_product'
                                                                    ? t('add_purchase_modal.plu_prefix')
                                                                    : t('add_purchase_modal.barcode_prefix')}
                                                                {itemIdentifier}{' '}
                                                                " {itemSupplier}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm">
                                                            {t('add_purchase_modal.cost_label')}{' '}
                                                            {formatCurrency(
                                                                itemCost,
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {t('add_purchase_modal.stock_label')} {itemStock}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Purchase Items */}
                        <div className="flex-1 overflow-hidden">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    {t('add_purchase_modal.purchase_items_header')} ({purchaseItems.length})
                                </h3>
                                {purchaseItems.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCompleteClear}
                                        className="h-8 gap-2 border-red-300 bg-red-50 text-red-700 hover:border-red-500 hover:bg-red-100 hover:text-red-800 focus:border-red-500 focus:bg-red-100 focus:ring-2 focus:ring-red-200 focus:outline-none dark:border-red-600 dark:bg-red-900/20 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-200 dark:focus:border-red-500 dark:focus:bg-red-900/30 dark:focus:ring-2 dark:focus:ring-red-400"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        {t('add_purchase_modal.clear_all')}
                                    </Button>
                                )}
                            </div>


                            {purchaseItems.length === 0 ? (
                                <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center">
                                    <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground">
                                        {t('add_purchase_modal.no_items_message')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('add_purchase_modal.search_add_products_hint')}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-md border">
                                    <div className="max-h-80 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 border-b border-primary/20 bg-primary/5 dark:border-primary/80 dark:bg-primary/95/20">
                                                <tr>
                                                    <th className="p-3 text-left font-medium">
                                                        {t('add_purchase_modal.product_column')}
                                                    </th>
                                                    <th className="p-3 text-left font-medium">
                                                        {t('add_purchase_modal.supplier_column')}
                                                    </th>
                                                    <th className="p-3 text-center font-medium">
                                                        {t('add_purchase_modal.quantity_column')}
                                                    </th>
                                                    <th className="p-3 text-center font-medium">
                                                        {t('add_purchase_modal.cost_price_column')}
                                                    </th>
                                                    <th className="p-3 text-center font-medium">
                                                        {t('add_purchase_modal.sell_price_column')}
                                                    </th>
                                                    <th className="p-3 text-center font-medium">
                                                        {t('add_purchase_modal.total_cost_column')}
                                                    </th>
                                                    <th className="p-3 text-center font-medium">
                                                        {t('add_purchase_modal.profit_percent_column')}
                                                    </th>
                                                    <th className="p-3 text-center font-medium">
                                                        {t('add_purchase_modal.actions_column')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchaseItems.map((item) => (
                                                    <tr
                                                        key={`${item.product_type}-${item.id}`}
                                                        className="border-b border-primary/10 hover:bg-primary/5 dark:border-primary/20 dark:hover:bg-primary/95/10"
                                                    >
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                {item.product_type ===
                                                                'scale_product' ? (
                                                                    <Scale className="h-4 w-4 text-orange-500" />
                                                                ) : (
                                                                    <Package className="h-4 w-4 text-[#1F3F3F]/50" />
                                                                )}
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {item.product_type ===
                                                                        'scale_product'
                                                                            ? t('add_purchase_modal.plu_prefix')
                                                                            : t('add_purchase_modal.barcode_prefix')}
                                                                        {
                                                                            item.identifier
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="w-40">
                                                                {item.supplier_name ? (
                                                                    <div className="flex items-center justify-between rounded border bg-background p-2 text-sm">
                                                                        <span className="truncate">
                                                                            {
                                                                                item.supplier_name
                                                                            }
                                                                        </span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="ml-1 h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                                            onClick={() =>
                                                                                clearSupplierSelection(
                                                                                    item.id,
                                                                                    item.product_type,
                                                                                )
                                                                            }
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full text-sm"
                                                                        onClick={() =>
                                                                            startEditingSupplier(
                                                                                item.id,
                                                                                item.product_type,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Plus className="mr-1 h-3 w-3" />
                                                                        {t('add_purchase_modal.add_supplier_button')}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updatePurchaseItem(
                                                                        item.id,
                                                                        item.product_type,
                                                                        'quantity',
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 1,
                                                                    )
                                                                }
                                                                onFocus={(e) => e.target.select()}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                className="w-20 text-center cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    item.cost_price
                                                                }
                                                                onChange={(e) =>
                                                                    updatePurchaseItem(
                                                                        item.id,
                                                                        item.product_type,
                                                                        'cost_price',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                                className="w-24 text-center"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    item.sell_price
                                                                }
                                                                onChange={(e) =>
                                                                    updatePurchaseItem(
                                                                        item.id,
                                                                        item.product_type,
                                                                        'sell_price',
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    )
                                                                }
                                                                className="w-24 text-center"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-center font-medium">
                                                            {formatCurrency(
                                                                item.total_cost,
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Badge
                                                                variant={
                                                                    (item.profit_margin ||
                                                                        0) > 0
                                                                        ? 'default'
                                                                        : 'destructive'
                                                                }
                                                            >
                                                                {(
                                                                    item.profit_margin ||
                                                                    0
                                                                ).toFixed(1)}
                                                                %
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeFromPurchase(
                                                                        item.id,
                                                                        item.product_type,
                                                                    )
                                                                }
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>

                    <DialogFooter className="border-t border-green-200 pt-4 dark:border-green-800">
                        <Button
                            variant="outline"
                            onClick={() => {
                                handleClose();
                                // Actually close the modal by calling onClose
                                onClose();
                            }}
                            className="border-green-300 bg-green-50 text-green-700 hover:border-green-500 hover:bg-green-100 hover:text-green-800 focus:border-green-500 focus:bg-green-100 focus:ring-2 focus:ring-green-200 focus:outline-none dark:border-green-600 dark:bg-green-900/20 dark:text-green-300 dark:hover:border-green-500 dark:hover:bg-green-900/30 dark:hover:text-green-200 dark:focus:border-green-500 dark:focus:bg-green-900/30 dark:focus:ring-2 dark:focus:ring-green-400"
                        >
                            {t('add_purchase_modal.cancel_button')}
                        </Button>
                        <Button
                            type="submit"
                            form="purchase-form"
                            disabled={saving || purchaseItems.length === 0}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-200 focus:outline-none disabled:opacity-50 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 dark:focus:ring-2 dark:focus:ring-green-400"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {editPurchase
                                        ? t('add_purchase_modal.updating_text')
                                        : t('add_purchase_modal.creating_text')}
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {editPurchase
                                        ? t('add_purchase_modal.update_purchase')
                                        : t('add_purchase_modal.create_purchase')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Supplier Search Modal - Separate Dialog */}
            <Dialog
                open={!!editingSupplierItemKey}
                onOpenChange={closeSupplierSearch}
            >
                <DialogContent
                    className="max-h-[80vh] max-w-2xl overflow-hidden [&>button]:hidden"
                    style={{ zIndex: 10001 }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            {t('add_purchase_modal.select_supplier_title')}
                        </DialogTitle>
                        
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder={t('add_purchase_modal.search_suppliers_placeholder')}
                                value={supplierSearchTerm}
                                onChange={(e) =>
                                    setSupplierSearchTerm(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        closeSupplierSearch();
                                    } else if (
                                        e.key === 'Enter' &&
                                        filteredSuppliers.length === 1
                                    ) {
                                        selectSupplier(filteredSuppliers[0]);
                                    }
                                }}
                                className="h-11 pl-10"
                                autoFocus
                            />
                        </div>

                        {/* Suppliers List */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                {t('add_purchase_modal.available_suppliers_label')}
                            </Label>
                            <div className="h-80 w-full overflow-y-auto rounded-md border">
                                <div className="space-y-2 p-4">
                                    {loadingSuppliers ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {t('add_purchase_modal.loading_suppliers_text')}
                                            </span>
                                        </div>
                                    ) : filteredSuppliers.length === 0 ? (
                                        <div className="py-12 text-center text-muted-foreground">
                                            {supplierSearchTerm
                                                ? t('add_purchase_modal.no_suppliers_found')
                                                : t('add_purchase_modal.no_suppliers_available')}
                                        </div>
                                    ) : (
                                        filteredSuppliers.map((supplier) => (
                                            <button
                                                key={supplier.id}
                                                type="button"
                                                className="group w-full rounded-lg border bg-card p-4 text-left transition-all duration-200 hover:border-primary/50 hover:bg-accent/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    selectSupplier(supplier);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-foreground">
                                                            {supplier.name}
                                                        </div>
                                                        <div className="mt-1 text-sm text-muted-foreground">
                                                            {supplier.supplier_code && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    {t('add_purchase_modal.code_prefix')}{' '}
                                                                    <span className="font-mono">
                                                                        {
                                                                            supplier.supplier_code
                                                                        }
                                                                    </span>
                                                                </span>
                                                            )}
                                                            {supplier.email && (
                                                                <span className="ml-4">
                                                                    {
                                                                        supplier.email
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        {supplier.phone && (
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                {t('add_purchase_modal.phone_prefix')}{' '}
                                                                {supplier.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:border-primary/80 dark:bg-primary/95/20">
                                                            {t('add_purchase_modal.select_button')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => closeSupplierSearch(false)}
                        >
                            {t('add_purchase_modal.cancel_button')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Product Modal - For adding new products while creating purchase */}
            <ProductModal
                isOpen={productModalOpen}
                onClose={handleProductModalClose}
                prefillBarcode={prefillBarcode}
            />

        </>
    );
}
