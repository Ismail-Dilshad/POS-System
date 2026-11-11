import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcutOptions {
    enabled?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    target?: HTMLElement | null;
}

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    handler: (event: KeyboardEvent) => void;
    description?: string;
    options?: KeyboardShortcutOptions;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const shortcutsRef = useRef(shortcuts);
    const targetRef = useRef<HTMLElement | null>(null);

    // Update shortcuts ref when shortcuts change
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const currentShortcuts = shortcutsRef.current;

        for (const shortcut of currentShortcuts) {
            const {
                key,
                ctrlKey = false,
                shiftKey = false,
                altKey = false,
                metaKey = false,
                handler,
                options = {},
            } = shortcut;

            const {
                enabled = true,
                preventDefault = true,
                stopPropagation = false,
                target = null,
            } = options;

            // Skip if shortcut is disabled
            if (!enabled) continue;

            // Check if target matches (if specified)
            if (target && event.target !== target) continue;

            // Check if key combination matches
            if (
                event.key === key &&
                event.ctrlKey === ctrlKey &&
                event.shiftKey === shiftKey &&
                event.altKey === altKey &&
                event.metaKey === metaKey
            ) {
                // Prevent default behavior
                if (preventDefault) {
                    event.preventDefault();
                }

                // Stop propagation
                if (stopPropagation) {
                    event.stopPropagation();
                }

                // Execute handler
                handler(event);
                break; // Only execute the first matching shortcut
            }
        }
    }, []);

    useEffect(() => {
        const target = targetRef.current || document;
        target.addEventListener('keydown', handleKeyDown as EventListener);

        return () => {
            target.removeEventListener(
                'keydown',
                handleKeyDown as EventListener,
            );
        };
    }, [handleKeyDown]);

    return {
        setTarget: (target: HTMLElement | null) => {
            targetRef.current = target;
        },
    };
}

// Specialized hook for pagination shortcuts
export interface PaginationShortcutsOptions {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    enabled?: boolean;
    target?: HTMLElement | null;
    onNavigate?: (direction: string, page: number) => void;
}

export function usePaginationShortcuts({
    currentPage,
    totalPages,
    onPageChange,
    enabled = true,
    target = null,
    onNavigate,
}: PaginationShortcutsOptions) {
    const navigateToPage = useCallback(
        (page: number, direction: string) => {
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                onPageChange(page);
                onNavigate?.(direction, page);
            }
        },
        [currentPage, totalPages, onPageChange, onNavigate],
    );

    const shortcuts: KeyboardShortcut[] = [
        {
            key: 'ArrowLeft',
            handler: () => {
                if (currentPage > 1) {
                    navigateToPage(currentPage - 1, 'previous');
                }
            },
            description: 'Go to previous page',
            options: { enabled, target },
        },
        {
            key: 'ArrowRight',
            handler: () => {
                if (currentPage < totalPages) {
                    navigateToPage(currentPage + 1, 'next');
                }
            },
            description: 'Go to next page',
            options: { enabled, target },
        },
        {
            key: 'Home',
            handler: () => {
                if (currentPage > 1) {
                    navigateToPage(1, 'first');
                }
            },
            description: 'Go to first page',
            options: { enabled, target },
        },
        {
            key: 'End',
            handler: () => {
                if (currentPage < totalPages) {
                    navigateToPage(totalPages, 'last');
                }
            },
            description: 'Go to last page',
            options: { enabled, target },
        },
        {
            key: 'PageUp',
            handler: () => {
                const newPage = Math.max(1, currentPage - 5);
                if (newPage !== currentPage) {
                    navigateToPage(newPage, 'page-up');
                }
            },
            description: 'Go back 5 pages',
            options: { enabled, target },
        },
        {
            key: 'PageDown',
            handler: () => {
                const newPage = Math.min(totalPages, currentPage + 5);
                if (newPage !== currentPage) {
                    navigateToPage(newPage, 'page-down');
                }
            },
            description: 'Go forward 5 pages',
            options: { enabled, target },
        },
        // Number keys 1-9 for direct page navigation
        ...Array.from({ length: 9 }, (_, i) => ({
            key: (i + 1).toString(),
            handler: () => {
                const pageNumber = i + 1;
                if (pageNumber <= totalPages && pageNumber !== currentPage) {
                    navigateToPage(pageNumber, `page-${pageNumber}`);
                }
            },
            description: `Go to page ${i + 1}`,
            options: { enabled, target },
        })),
    ];

    return useKeyboardShortcuts(shortcuts);
}
