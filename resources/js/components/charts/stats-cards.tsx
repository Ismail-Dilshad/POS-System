import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrencyStats } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Info, LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    badge?: {
        text: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
        color?:
            | 'blue'
            | 'green'
            | 'orange'
            | 'red'
            | 'purple'
            | 'indigo'
            | 'pink'
            | 'teal'
            | 'yellow'
            | 'cyan'
            | 'emerald'
            | 'amber';
    };
    color?:
        | 'blue'
        | 'green'
        | 'orange'
        | 'red'
        | 'purple'
        | 'indigo'
        | 'pink'
        | 'teal'
        | 'yellow'
        | 'cyan'
        | 'emerald'
        | 'amber';
    loading?: boolean;
    className?: string;
    isCurrency?: boolean;
    showInfoButton?: boolean;
}

const colorVariants = {
    blue: {
        icon: 'text-blue-700 dark:text-blue-300',
        accent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    },
    green: {
        icon: 'text-green-600 dark:text-green-400',
        accent: 'bg-green-500/10 text-green-700 dark:text-green-300',
    },
    orange: {
        icon: 'text-orange-700 dark:text-orange-300',
        accent: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    },
    red: {
        icon: 'text-red-600 dark:text-red-400',
        accent: 'bg-red-500/10 text-red-700 dark:text-red-300',
    },
    purple: {
        icon: 'text-purple-600 dark:text-purple-400',
        accent: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    },
    indigo: {
        icon: 'text-indigo-600 dark:text-indigo-400',
        accent: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    },
    pink: {
        icon: 'text-pink-600 dark:text-pink-400',
        accent: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
    },
    teal: {
        icon: 'text-teal-700 dark:text-teal-300',
        accent: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300',
    },
    yellow: {
        icon: 'text-yellow-600 dark:text-yellow-400',
        accent: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
    },
    cyan: {
        icon: 'text-cyan-700 dark:text-cyan-300',
        accent: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
    },
    emerald: {
        icon: 'text-emerald-700 dark:text-emerald-300',
        accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    },
    amber: {
        icon: 'text-amber-700 dark:text-amber-300',
        accent: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    },
};

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    badge,
    color = 'blue',
    loading = false,
    className,
    isCurrency = false,
    showInfoButton = false,
}: StatCardProps) {
    const { t } = useTranslation();
    const colors = colorVariants[color] || colorVariants.blue; // Fallback to blue if color not found

    // Process currency values
    let displayValue = value;
    let fullValue = value;
    let isCompact = false;
    let showInfo = showInfoButton;
    let indicator = '';

    if (isCurrency) {
        // Convert value to number if it's a string
        const numericValue =
            typeof value === 'string' ? parseFloat(value) : value;

        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
            const currencyData = formatCurrencyStats(numericValue);
            displayValue = currencyData.display;
            fullValue = currencyData.full;
            isCompact = currencyData.isCompact;
            indicator = currencyData.indicator;
            showInfo = showInfo || isCompact; // Show info button for compact values
        } else {
            // Fallback for invalid currency values
            displayValue = 'IQD 0';
            fullValue = 'IQD 0';
            isCompact = false;
            indicator = '';
        }
    }

    // Determine if this is a large monetary value (contains IQD and has long text)
    const valueStr = String(displayValue);
    const isLargeValue = valueStr.includes('IQD') && valueStr.length > 10;
    const isVeryLargeValue =
        valueStr.includes('IQD') &&
        (valueStr.length > 15 || valueStr.includes('M'));

    if (loading) {
        return (
            <div
                className={cn(
                    'rounded-md bg-card p-4 text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)]',
                    className,
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="h-4 animate-pulse rounded bg-muted/50" />
                        <div className="h-8 w-3/4 animate-pulse rounded bg-muted/30" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-muted/20" />
                    </div>
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted/30" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group relative cursor-pointer overflow-hidden rounded-md bg-card p-4 text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
                className,
            )}
        >
            <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                        <h3 className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground lg:text-sm">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <p
                                    className={cn(
                                        'font-semibold tracking-tight transition-colors group-hover:text-foreground',
                                        // Dynamic sizing based on value length and type
                                        isVeryLargeValue
                                            ? 'text-xs lg:text-sm' // Very small for very large numbers (IQD 1.5M)
                                            : isLargeValue
                                              ? 'text-sm lg:text-base' // Small for large numbers (IQD 1,500,000)
                                              : 'text-base lg:text-lg', // Normal size for regular numbers
                                    )}
                                >
                                    {displayValue}
                                </p>
                                {isCompact && indicator && (
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {indicator}
                                    </span>
                                )}
                            </div>
                            {showInfo && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-muted/10 dark:hover:bg-muted/20"
                                                aria-label={t('stats_cards.show_full_amount')}
                                            >
                                                <Info className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            align="center"
                                            delayDuration={200}
                                        >
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {t('stats_cards.full_amount_label', {
                                                        defaultValue: 'Full Amount',
                                                    })}
                                                </div>
                                                <div className="text-sm">
                                                    {fullValue}
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {description && (
                            <p className="hidden text-xs text-muted-foreground transition-colors group-hover:text-foreground/80 lg:block">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Badge in top right */}
                    {badge && (
                        <Badge
                            variant={badge.variant || 'secondary'}
                            className={cn(
                                'text-xs font-medium transition-all duration-200',
                                badge.color &&
                                    colorVariants[badge.color]?.accent,
                            )}
                        >
                            {badge.text}
                        </Badge>
                    )}
                </div>

                {/* Icon in bottom right */}
                <div
                    className={cn(
                        'absolute right-1 bottom-1 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 lg:right-2 lg:bottom-2 lg:h-10 lg:w-10',
                        colors.accent,
                    )}
                >
                    <Icon
                        className={cn(
                            'h-4 w-4 transition-colors lg:h-5 lg:w-5',
                            colors.icon,
                        )}
                    />
                </div>
            </div>
        </div>
    );
}

interface StatsCardsProps {
    children: ReactNode;
    className?: string;
}

export function StatsCards({ children, className }: StatsCardsProps) {
    return (
        <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-6', className)}>
            {children}
        </div>
    );
}
