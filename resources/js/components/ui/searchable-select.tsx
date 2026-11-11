import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Search, X, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface SearchableSelectOption {
    id: string | number;
    name: string;
    [key: string]: unknown;
}

interface SearchableSelectProps {
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    options: SearchableSelectOption[];
    value?: SearchableSelectOption | null;
    onSelect: (option: SearchableSelectOption | null) => void;
    onSearch?: (query: string) => void;
    loading?: boolean;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    error?: string;
    noResultsText?: string;
    clearable?: boolean;
}

export function SearchableSelect({
    label,
    placeholder,
    searchPlaceholder,
    options = [],
    value,
    onSelect,
    onSearch,
    loading = false,
    disabled = false,
    required = false,
    className,
    error,
    noResultsText,
    clearable = true
}: SearchableSelectProps) {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder ?? t('common.select_option');
    const resolvedSearchPlaceholder = searchPlaceholder ?? t('ui_components.search_placeholder');
    const resolvedNoResultsText = noResultsText ?? t('ui_components.no_results_found');
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search with debouncing
    useEffect(() => {
        if (onSearch && searchQuery !== '') {
            const timeoutId = setTimeout(() => {
                onSearch(searchQuery);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, onSearch]);

    // Reset highlighted index when options change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [options]);

    const handleInputFocus = () => {
        if (!disabled) {
            setIsOpen(true);
            if (onSearch) {
                onSearch('');
            }
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setHighlightedIndex(-1);

        if (!isOpen) {
            setIsOpen(true);
        }
    };

    const handleOptionSelect = (option: SearchableSelectOption) => {
        onSelect(option);
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(null);
        setSearchQuery('');
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setIsOpen(true);
                return;
            }
        }

        switch (e.key) {
            case 'Escape':
                setIsOpen(false);
                setSearchQuery('');
                setHighlightedIndex(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < options.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : options.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && options[highlightedIndex]) {
                    handleOptionSelect(options[highlightedIndex]);
                }
                break;
        }
    };

    const displayValue = value ? value.name : '';
    const showInput = isOpen || searchQuery;

    return (
        <div className={cn("space-y-2", className)} ref={containerRef}>
            {label && (
                <Label className="text-sm font-medium">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            )}

            <div className="relative">
                {/* Main Input/Trigger */}
                <div
                    className={cn(
                        "relative flex items-center w-full rounded-md bg-background text-sm ring-offset-background shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(16,53,62,0.3)] dark:hover:shadow-[0_0_0_1px_rgba(16,53,62,0.5)] focus:shadow-[0_0_0_1px_rgba(16,53,62,0.5)] dark:focus:shadow-[0_0_0_1px_rgba(16,53,62,0.7)]",
                        "hover:border-ring transition-all duration-200",
                        "h-11 px-3 py-2",
                        disabled && "cursor-not-allowed opacity-50",
                        error && "border-destructive",
                        isOpen && "ring-2 ring-ring ring-offset-2 border-ring"
                    )}
                    onClick={() => !disabled && setIsOpen(true)}
                >
                    <Search className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />

                    {showInput ? (
                        <input
                            ref={inputRef}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={handleInputFocus}
                            onKeyDown={handleKeyDown}
                            placeholder={resolvedSearchPlaceholder}
                            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                            disabled={disabled}
                        />
                    ) : (
                        <div
                            className="flex-1 cursor-pointer truncate py-0.5"
                            onClick={() => !disabled && inputRef.current?.focus()}
                        >
                            {displayValue || (
                                <span className="text-muted-foreground">{resolvedPlaceholder}</span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-1 ml-3">
                        {value && clearable && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        )}
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                                isOpen && "rotate-180"
                            )}
                        />
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className={cn(
                            "absolute z-50 w-full mt-2 bg-background border-0 border rounded-lg shadow-xl",
                            "max-h-64 overflow-hidden",
                            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                        )}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                                <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
                            </div>
                        ) : options.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {resolvedNoResultsText}
                            </div>
                        ) : (
                            <div className="py-2 max-h-60 overflow-y-auto">
                                {options.map((option, index) => (
                                    <div
                                        key={option.id}
                                        onClick={() => handleOptionSelect(option)}
                                        className={cn(
                                            "relative flex items-center px-4 py-3 text-sm cursor-pointer transition-all duration-150",
                                            "hover:bg-accent/80 hover:text-accent-foreground",
                                            "border-l-2 border-transparent",
                                            highlightedIndex === index && "bg-accent text-accent-foreground border-l-primary",
                                            value?.id === option.id && "bg-primary/10 text-primary font-medium border-l-primary"
                                        )}
                                    >
                                        <span className="flex-1 truncate">{option.name}</span>
                                        {value?.id === option.id && (
                                            <Check className="h-4 w-4 ml-3 flex-shrink-0 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}