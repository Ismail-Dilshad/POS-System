import { ReactNode } from 'react';

export interface Column<T = unknown> {
    key: string;
    header: string | ReactNode;
    accessor?: keyof T | ((row: T) => unknown);
    render?: (value: unknown, row: T, index: number) => ReactNode;
    sortable?: boolean;
    width?: string | number;
    className?: string;
    headerClassName?: string;
}

export interface DataTableProps<T = unknown> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    onRowClick?: (row: T, index: number) => void;
    rowClassName?: string | ((row: T, index: number) => string);
    // Header props
    title?: string;
    subtitle?: string;
    headerActions?: ReactNode;
    // Pagination props
    pagination?: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
        showInfo?: boolean;
    };
    // Sorting props
    sorting?: {
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        onSort?: (key: string) => void;
    };
    // Virtual scrolling props
    virtualScrolling?: boolean;
    rowHeight?: number;
}

export interface TableAction<T = unknown> {
    label: string;
    icon?: ReactNode;
    onClick: (row: T, index: number) => void;
    className?: string;
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean | ((row: T) => boolean);
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    showingFrom: number;
    showingTo: number;
}
