import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
    const { getCurrentLanguage } = useTranslation();
    const isKurdish = getCurrentLanguage() === 'ku';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div
            className={cn(
                'rounded-md bg-card text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]',
                'p-6',
                className,
            )}
        >
            {/* Mobile/Tablet Header */}
            <div className="flex items-center justify-between lg:hidden">
                <h1
                    className={cn(
                        'font-semibold tracking-tight text-foreground',
                        isKurdish
                            ? 'text-lg sm:text-xl'
                            : 'text-base sm:text-lg',
                    )}
                >
                    {title}
                </h1>

                {children && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="h-8 w-8 p-0 hover:bg-muted/10"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Menu className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* Mobile/Tablet Menu - Dropdown */}
            {isMobileMenuOpen && children && (
                <div className="mt-4 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] pt-4 lg:hidden">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                        {children}
                    </div>
                </div>
            )}

            {/* Desktop Header */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
                <div className="flex flex-col gap-1">
                    <h1
                        className={cn(
                            'font-semibold tracking-tight text-foreground',
                            isKurdish
                                ? 'text-2xl xl:text-3xl'
                                : 'text-xl xl:text-2xl',
                        )}
                    >
                        {title}
                    </h1>
                </div>
                {children && (
                    <div className="flex items-center gap-3">{children}</div>
                )}
            </div>
        </div>
    );
}
