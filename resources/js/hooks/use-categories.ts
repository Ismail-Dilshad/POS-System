import { categoryService, type Category } from '@/services/business/categoryService';
import { useCallback, useEffect, useState } from 'react';

interface UseCategoriesOptions {
    initialLoad?: boolean;
    cacheTime?: number;
}

interface UseCategoriesResult {
    categories: Category[];
    loading: boolean;
    error: string | null;
    searchCategories: (query: string) => Promise<void>;
    refetch: () => Promise<void>;
}

// Global cache for categories
const categoryCache = new Map<
    string,
    { data: Category[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCategories(
    options: UseCategoriesOptions = {},
): UseCategoriesResult {
    const { initialLoad = true, cacheTime = CACHE_DURATION } = options;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if cache is valid
    const isCacheValid = useCallback(
        (key: string): boolean => {
            const cached = categoryCache.get(key);
            if (!cached) return false;
            return Date.now() - cached.timestamp < cacheTime;
        },
        [cacheTime],
    );

    // Get from cache or fetch
    const fetchCategories = useCallback(
        async (search: string = '') => {
            const cacheKey = `categories_${search}`;

            // Return cached data if valid
            if (isCacheValid(cacheKey)) {
                const cached = categoryCache.get(cacheKey);
                if (cached) {
                    setCategories(cached.data);
                    return;
                }
            }

            setLoading(true);
            setError(null);

            try {
                const response = await categoryService.getCategories(search);

                if (response.success && response.data) {
                    // Cache the result
                    categoryCache.set(cacheKey, {
                        data: response.data,
                        timestamp: Date.now(),
                    });
                    setCategories(response.data);
                } else {
                    setError(response.message || 'Failed to load categories');
                }
            } catch {
                setError('Failed to load categories');
            } finally {
                setLoading(false);
            }
        },
        [isCacheValid],
    );

    // Search categories with debouncing handled by component
    const searchCategories = useCallback(
        async (query: string) => {
            await fetchCategories(query);
        },
        [fetchCategories],
    );

    // Refetch current data
    const refetch = useCallback(async () => {
        // Clear cache and refetch
        categoryCache.clear();
        await fetchCategories();
    }, [fetchCategories]);

    // Initial load
    useEffect(() => {
        if (initialLoad) {
            fetchCategories();
        }
    }, [initialLoad, fetchCategories]);

    return {
        categories,
        loading,
        error,
        searchCategories,
        refetch,
    };
}
