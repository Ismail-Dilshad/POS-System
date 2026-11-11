import AppLogoIcon from '@/components/layout/app-logo-icon';
import { CashierShortcutsDialog } from '@/components/layout/cashier-shortcuts-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { useLogout } from '@/hooks/use-logout';
import { useTranslation } from '@/hooks/use-translation';
import { usePage } from '@inertiajs/react';
import { Info, Globe, LogOut, Moon, Sun, Calculator } from 'lucide-react';
import { useState } from 'react';
import { CenteredDateTimeDisplay } from '@/components/ui/date-time-display';
import { CalculatorModal } from '@/components/modals/calculator-modal';

export function CashierHeader() {
    const page = usePage();
    const { auth } = (page.props as { auth?: { user?: Record<string, unknown> } }) ?? {};
    const getInitials = useInitials();
    const { t } = useTranslation();
    const { submitLogout, isLoggingOut } = useLogout();
    const { appearance, updateAppearance } = useAppearance();
    const { getCurrentLanguage, changeLanguage } = useTranslation();

    const user = auth?.user as
        | {
              full_name?: string;
              avatar?: string;
              role?: string;
          }
        | undefined;

    const marketName = t('auth_layout.market_system') || 'Ali Network POS';
    const displayName = user?.full_name ?? t('app_header.fallback_user');
    const roleLabel = user?.role
        ? t(`roles.${user.role}`, { defaultValue: user.role })
        : undefined;

    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    const toggleTheme = () => {
        updateAppearance(appearance === 'light' ? 'dark' : 'light');
    };

    const toggleLanguage = () => {
        const currentLang = getCurrentLanguage() || 'ku';
        const newLang = currentLang === 'ku' ? 'en' : 'ku';
        changeLanguage(newLang);
    };


    return (
        <header className="bg-background shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3),0_1px_2px_0_rgba(0,0,0,0.2)]">
            <div className="flex h-16 w-full items-center justify-between px-4">
                {/* Left Section - Logo and Market Name */}
                <div className="flex items-center gap-3 text-lg font-semibold text-foreground">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full shadow-lg">
                        <AppLogoIcon alt={marketName} className="size-10" />
                    </span>
                    <span className="hidden sm:inline-block">{marketName}</span>
                </div>

                {/* Center Section - Date and Time */}
                <div className="hidden lg:flex items-center justify-center flex-1">
                    <CenteredDateTimeDisplay />
                </div>

                {/* Right Section - Buttons and User Info */}
                <div className="flex items-center gap-2">
                    {/* Logout Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => submitLogout()}
                        disabled={isLoggingOut}
                        className="h-8 w-8 p-0 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-200"
                    >
                        <LogOut className="size-4" />
                    </Button>

                    {/* Help Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShortcutsOpen(true)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        <Info className="h-4 w-4 text-blue-500" />
                    </Button>

                    {/* Calculator Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Calculator"
                        onClick={() => setIsCalculatorOpen(true)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        <Calculator className="h-4 w-4 text-blue-600" />
                    </Button>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                        {appearance === 'light' ? (
                            <Moon className="h-4 w-4 text-purple-500" />
                        ) : (
                            <Sun className="h-4 w-4 text-purple-500" />
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

                    {/* Separator */}
                    <div className="h-6 w-px bg-border/60"></div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-foreground">
                                {displayName}
                            </p>
                            {roleLabel && (
                                <p className="text-[10px] text-muted-foreground">
                                    {roleLabel}
                                </p>
                            )}
                        </div>
                        <Avatar className="size-8 border-2 border-primary/20 shadow-sm">
                            <AvatarImage src={user?.avatar ?? undefined} alt={displayName} />
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase text-primary">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
            <CashierShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
            <CalculatorModal
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
            />
        </header>
    );
}
