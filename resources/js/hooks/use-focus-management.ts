import { useEffect } from 'react';

/**
 * Hook to manage focus when modals open to prevent accessibility warnings
 */
export function useFocusManagement(isOpen: boolean) {
    useEffect(() => {
        if (!isOpen) return;

        const cleanupFocus = () => {
            // Blur any focused file inputs
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                if (input instanceof HTMLElement && document.activeElement === input) {
                    input.blur();
                }
            });
            
            // Blur sidebar elements that might be focused
            const sidebarElements = document.querySelectorAll('[data-sidebar="menu-button"], [data-sidebar="menu-item"]');
            sidebarElements.forEach(element => {
                if (element instanceof HTMLElement && document.activeElement === element) {
                    element.blur();
                }
            });
            
            // Blur any other potentially problematic focused elements
            const activeElement = document.activeElement;
            if (activeElement && activeElement !== document.body) {
                const isHidden = activeElement.closest('[aria-hidden="true"]');
                if (isHidden) {
                    (activeElement as HTMLElement).blur();
                }
            }
            
            // Additional cleanup for buttons and interactive elements
            const focusedButtons = document.querySelectorAll('button:focus, [role="button"]:focus');
            focusedButtons.forEach(button => {
                if (button instanceof HTMLElement) {
                    const isInHiddenArea = button.closest('[aria-hidden="true"]');
                    if (isInHiddenArea) {
                        button.blur();
                    }
                }
            });
        };

        // Run cleanup after a short delay to ensure DOM is updated
        const timeoutId = setTimeout(cleanupFocus, 0);
        
        return () => clearTimeout(timeoutId);
    }, [isOpen]);
}
