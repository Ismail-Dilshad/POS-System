import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { CashierShortcutsDialog } from '@/components/layout/cashier-shortcuts-dialog';
import { CalculatorModal } from '@/components/modals/calculator-modal';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTranslation } from '@/hooks/use-translation';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { Globe, Moon, Sun, Info, Calculator } from 'lucide-react';
import { useCallback, useState } from 'react';
import { CenteredDateTimeDisplay } from '@/components/ui/date-time-display';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage();
    const auth = (page.props as Record<string, unknown>).auth as
        | { user: { role?: string } }
        | undefined;
    
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();
    const { getCurrentLanguage, changeLanguage } = useTranslation();
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    
    const isAdminUser = auth?.user?.role === 'admin';
    const isDataEntryUser = auth?.user?.role === 'dataentry';
    const isCashierUser = auth?.user?.role === 'cashier';

    const openShortcuts = useCallback(() => {
        cleanup();
        setShortcutsOpen(true);
    }, [cleanup]);

    const toggleTheme = () => {
        updateAppearance(appearance === 'light' ? 'dark' : 'light');
    };

    const supportedLanguages = ['ku', 'en'];
    const toggleLanguage = () => {
        const currentLang = getCurrentLanguage();
        const currentIndex = supportedLanguages.indexOf(currentLang);
        const nextIndex = (currentIndex + 1) % supportedLanguages.length;
        changeLanguage(supportedLanguages[nextIndex]);
    };


    const isDark = appearance === 'dark';

    return (
        <>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#4A6CF7]/20 bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                {/* Left Section */}
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                
                {/* Center Section - Date and Time */}
                <div className="hidden lg:flex items-center justify-center flex-1">
                    <CenteredDateTimeDisplay />
                </div>
                
                {/* Right Section - Buttons */}
                <div className="flex items-center gap-2">
                    {/* Help - Admin only */}
                    {isAdminUser && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={openShortcuts}
                            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            <Info className="h-4 w-4 text-blue-500" />
                        </Button>
                    )}

                    {/* Calculator - Cashier only (positioned after Help button) */}
                    {isCashierUser && (
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Calculator"
                            onClick={() => setIsCalculatorOpen(true)}
                            className="h-8 w-8 p-0 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                            <Calculator className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </Button>
                    )}

                    {/* Calculator - Admin and Data Entry only (Cashier has it positioned after Help button) */}
                    {(isAdminUser || isDataEntryUser) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Calculator"
                            onClick={() => setIsCalculatorOpen(true)}
                            className="h-8 w-8 p-0 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                            <Calculator className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </Button>
                    )}
                    
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                        {isDark ? (
                            <Sun className="h-4 w-4 text-purple-500" />
                        ) : (
                            <Moon className="h-4 w-4 text-purple-500" />
                        )}
                    </Button>
                    
                    {/* Language Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLanguage}
                        className="h-8 w-8 p-0 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Globe className="h-4 w-4 text-rose-500" />
                    </Button>
                </div>
            </header>

            {/* Calculator Modal */}
            <CalculatorModal
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
            />

            {/* Shortcuts Dialog - Admin only */}
            {isAdminUser && (
                <CashierShortcutsDialog 
                    open={shortcutsOpen} 
                    onOpenChange={setShortcutsOpen} 
                />
            )}
        </>
    );
}
