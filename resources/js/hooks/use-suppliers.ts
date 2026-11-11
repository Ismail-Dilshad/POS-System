import { supplierService, type Supplier } from '@/services/business/supplierService';
import { useCallback, useEffect, useState } from 'react';

interface UseSuppliersOptions {
    initialLoad?: boolean;
    cacheTime?: number;
}

interface UseSuppliersResult {
    suppliers: Supplier[];
    loading: boolean;
    error: string | null;
    searchSuppliers: (query: string) => Promise<void>;
    refetch: () => Promise<void>;
}

// Global cache for suppliers
const supplierCache = new Map<
    string,
    { data: Supplier[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSuppliers(
    options: UseSuppliersOptions = {},
): UseSuppliersResult {
    const { initialLoad = true, cacheTime = CACHE_DURATION } = options;

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if cache is valid
    const isCacheValid = useCallback(
        (key: string): boolean => {
            const cached = supplierCache.get(key);
            if (!cached) return false;
            return Date.now() - cached.timestamp < cacheTime;
        },
        [cacheTime],
    );

    // Get from cache or fetch
    const fetchSuppliers = useCallback(
        async (search: string = '') => {
            const cacheKey = `suppliers_${search}`;

            // Return cached data if valid
            if (isCacheValid(cacheKey)) {
                const cached = supplierCache.get(cacheKey);
                if (cached) {
                    setSuppliers(cached.data);
                    return;
                }
            }

            setLoading(true);
            setError(null);

            try {
                const response = await supplierService.getSuppliers(search);

                if (response.success && response.data) {
                    // Cache the result
                    supplierCache.set(cacheKey, {
                        data: response.data,
                        timestamp: Date.now(),
                    });
                    setSuppliers(response.data);
                } else {
                    setError(response.message || 'Failed to load suppliers');
                }
            } catch {
                setError('Failed to load suppliers');
            } finally {
                setLoading(false);
            }
        },
        [isCacheValid],
    );

    // Search suppliers with debouncing handled by component
    const searchSuppliers = useCallback(
        async (query: string) => {
            await fetchSuppliers(query);
        },
        [fetchSuppliers],
    );

    // Refetch current data
    const refetch = useCallback(async () => {
        // Clear cache and refetch
        supplierCache.clear();
        await fetchSuppliers();
    }, [fetchSuppliers]);

    // Initial load
    useEffect(() => {
        if (initialLoad) {
            fetchSuppliers();
        }
    }, [initialLoad, fetchSuppliers]);

    return {
        suppliers,
        loading,
        error,
        searchSuppliers,
        refetch,
    };
}
