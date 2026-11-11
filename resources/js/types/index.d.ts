import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

// Global type declarations
declare module '@inertiajs/react' {
    export const Link: React.ComponentType<InertiaLinkProps>;
    export const usePage: () => { props: Record<string, unknown> };
    export const createInertiaApp: (config: Record<string, unknown>) => void;
    export const router: Record<string, unknown>;
    export const Form: React.ComponentType<Record<string, unknown>>;
}

// Global declarations for Inertia.js
declare global {
    const createInertiaApp: (config: Record<string, unknown>) => void;
    const router: Record<string, unknown>;
}

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    component?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    full_name: string;
    username: string;
    role: string;
    avatar?: string;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Re-export table types
export * from './table';

// API Response type
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    error?: string;
}

// Additional type definitions
export interface ImportResults {
    success: boolean;
    message: string;
    data?: {
        created: number;
        updated: number;
        skipped: number;
        errors: string[];
        total_processed: number;
    };
    statistics?: {
        created: number;
        updated: number;
        skipped: number;
    };
    created?: number;
    updated?: number;
    skipped?: number;
    total_processed?: number;
    errors?: string[];
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface AdjustmentResult {
    id: number;
    product_id: number;
    product_name: string;
    old_stock: number;
    new_stock: number;
    adjustment: number;
    reason: string;
    created_at: string;
}

export interface PurchaseItem {
    id: number;
    name: string;
    product_type: string;
    identifier: string;
    current_cost_price: number;
    current_sell_price: number;
    cost_price: number;
    sell_price: number;
    quantity: number;
    supplier_id: number;
    supplier_name: string;
    total_cost: number;
    profit_margin: number;
}

export interface ReturnItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    reason: string;
    created_at: string;
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface TransactionStatistics {
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    total_transactions: number;
    transactions_today: number;
    revenue_today: number;
    average_transaction_value: number;
    total_items_sold: number;
    daily_sales: Array<{
        date: string;
        total_amount: number;
        transactions_count: number;
    }>;
    // Additional properties for compatibility
    [key: string]: unknown;
    // Legacy properties for backward compatibility
    total_sales?: number;
    total_items_sold?: number;
}

export interface ReportFilter {
    date_from?: string;
    date_to?: string;
    category_id?: number;
    supplier_id?: number;
    product_type?: string;
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface FilterOptions {
    productType?: string;
    product_type?: string; // Alternative naming
    category_id?: number;
    supplier_id?: number;
    status?: string;
    search?: string;
}

export interface PrintConfiguration {
    product: Product;
    labelSize: number;
    quantityPerProduct?: number;
}

export interface SupplierPayment {
    id: number;
    purchase_id: number;
    supplier_id: number;
    supplier_name: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
    created_at: string;
    updated_at: string;
}

export interface NameCard {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Card {
    id: number;
    name_card_id: number;
    name_card: NameCard;
    cost_price: number;
    sell_price: number;
    profit_margin: number;
    created_at: string;
    updated_at: string;
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface Product {
    image_url?: string | null;
    id: number;
    name: string;
    category_id: number;
    supplier_id: number;
    barcode_type: string;
    barcode: string;
    secondary_barcode?: string;
    cost_price: number;
    sell_price: number;
    stock: number;
    min_stock: number;
    show_in_pos: boolean;
    expire_date?: string;
    last_sold_at?: string;
    created_at: string;
    updated_at: string;
    category?: { id: number; name: string };
    supplier?: { id: number; name: string };
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface ScaleProduct {
    image_url?: string | null;
    id: number;
    name: string;
    scale_id: string;
    plu: string;
    category_id: number;
    supplier_id: number;
    cost_price: number;
    sell_price: number;
    profit_margin: number;
    created_at: string;
    updated_at: string;
    category?: { id: number; name: string };
    supplier?: { id: number; name: string };
    // Additional properties for compatibility
    barcode?: string;
    [key: string]: unknown;
}

export interface Category {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Supplier {
    id: number;
    name: string;
    supplier_code: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    total_debt: number;
    created_at: string;
    updated_at: string;
    // Additional properties for compatibility
    business_name?: string;
    business_address?: string;
    business_city?: string;
    business_state?: string;
    business_postal_code?: string;
    business_country?: string;
    business_phone?: string;
    business_email?: string;
    business_website?: string;
    business_notes?: string;
    billing_contact_name?: string;
    billing_contact_phone?: string;
    billing_contact_email?: string;
    biller_position?: string;
    biller_department?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    [key: string]: unknown;
}

export interface InventoryStatistics {
    total_products: number;
    total_stock: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    categories_count: number;
    suppliers_count: number;
    average_cost: number;
    average_sell_price: number;
    total_profit_margin: number;
    total_items?: number;
    total_sell_value?: number;
    total_cost?: number;
    potential_profit?: number;
    expiring_in_30_days?: number;
    expired_items?: number;
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface InventoryItem {
    image_url?: string | null;
    id: number;
    name: string;
    product_type: 'product' | 'scale_product' | 'card';
    identifier: string;
    identifier_type: string;
    barcode?: string;
    secondary_barcode?: string;
    category?:
        | string
        | { id: number; name: string; created_at: string; updated_at: string };
    supplier?:
        | string
        | { id: number; name: string; created_at: string; updated_at: string };
    cost_price: number;
    sell_price: number;
    stock?: number;
    min_stock?: number;
    per_carton?: number;
    carton_price?: number | null;
    carton_info?: string;
    status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
    profit_margin: number;
    profit_amount: number;
    created_at: string;
    updated_at: string;
    original_data: Product | ScaleProduct | Card;
    // Additional properties for compatibility
    [key: string]: unknown;
}

export interface transactionsFilterOptions {
    date_from?: string;
    date_to?: string;
    user_id?: number;
    payment_method?: string;
    min_amount?: number;
    max_amount?: number;
}

export interface transactionsFilterComponentProps {
    filters: transactionsFilterOptions;
    onFiltersChange: (newFilters: transactionsFilterOptions) => void;
    onClearFilters?: () => void;
}

export interface Note {
    id?: number;
    user_id?: number;
    content: string;
    created_at?: string;
    updated_at?: string;
}
