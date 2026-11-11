import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';

export interface ComboboxOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: ComboboxOption | null;
    onValueChange: (value: ComboboxOption | null) => void;
    onSearch?: (query: string) => void;
    placeholder?: string;
    emptyText?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    searchDelay?: number;
    maxHeight?: string;
    clearable?: boolean;
}

// Cache for search results to improve performance
const searchCache = new Map<string, ComboboxOption[]>();

export function Combobox({
    options = [],
    value,
    onValueChange,
    onSearch,
    placeholder,
    emptyText,
    label,
    required = false,
    disabled = false,
    loading = false,
    className,
    searchDelay = 300,
    maxHeight = "256px",
    clearable = true,
}: ComboboxProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const resolvedPlaceholder = placeholder ?? t('common.select_option');

    const triggerRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Debounced search with caching
    const debouncedSearch = useCallback((query: string) => {
        const timeoutId = setTimeout(() => {
            // Check cache first
            const cacheKey = `search_${query}`;
            if (searchCache.has(cacheKey)) {
                return;
            }

            if (onSearch) {
                onSearch(query);
            }
        }, searchDelay);
        
        return () => clearTimeout(timeoutId);
    }, [onSearch, searchDelay]);

    // Filtered options based on search
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;

        // Check cache first
        const cacheKey = `search_${searchTerm}`;
        if (searchCache.has(cacheKey)) {
            return searchCache.get(cacheKey)!;
        }

        // Filter locally if no onSearch function
        if (!onSearch) {
            const filtered = options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
            searchCache.set(cacheKey, filtered);
            return filtered;
        }

        return options;
    }, [options, searchTerm, onSearch]);

    // Reset highlighted index when options change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [filteredOptions]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                listRef.current &&
                !listRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm("");
                setHighlightedIndex(-1);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
            optionRefs.current[highlightedIndex]?.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }
    }, [highlightedIndex]);

    const handleToggle = useCallback(() => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm("");
            setHighlightedIndex(-1);
        }
    }, [disabled, isOpen]);

    const handleSelect = useCallback((option: ComboboxOption) => {
        if (option.disabled) return;
        onValueChange(option);
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
    }, [onValueChange]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange(null);
        setSearchTerm("");
    }, [onValueChange]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchTerm(query);
        setHighlightedIndex(-1);
        debouncedSearch(query);
    }, [debouncedSearch]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case "Enter":
                e.preventDefault();
                if (isOpen) {
                    if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                        handleSelect(filteredOptions[highlightedIndex]);
                    }
                } else {
                    setIsOpen(true);
                }
                break;
            case "ArrowDown":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (isOpen) {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
                    );
                }
                break;
            case "Escape":
                setIsOpen(false);
                setSearchTerm("");
                setHighlightedIndex(-1);
                triggerRef.current?.focus();
                break;
            case "Tab":
                setIsOpen(false);
                setSearchTerm("");
                setHighlightedIndex(-1);
                break;
        }
    }, [isOpen, highlightedIndex, filteredOptions, handleSelect]);

    const displayValue = value?.label || "";
    const showSearch = isOpen;

    return (
        <div className={cn("relative", className)}>
            {label && (
                <Label className="text-sm font-medium mb-2 block">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            )}

            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "relative w-full h-11 px-3 py-2 text-left bg-background rounded-md shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(16,53,62,0.3)] dark:hover:shadow-[0_0_0_1px_rgba(16,53,62,0.5)] focus:shadow-[0_0_0_1px_rgba(16,53,62,0.5)] dark:focus:shadow-[0_0_0_1px_rgba(16,53,62,0.7)]",
                    "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "transition-colors duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen && "ring-2 ring-ring ring-offset-2 border-ring"
                )}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={label ? `${label}-label` : undefined}
            >
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                    {showSearch ? (
                        <input
                            ref={inputRef}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            placeholder={t('ui_components.search_placeholder')}
                            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                            disabled={disabled}
                        />
                    ) : (
                        <span className={cn(
                            "flex-1 truncate",
                            !displayValue && "text-muted-foreground"
                        )}>
                            {displayValue || resolvedPlaceholder}
                        </span>
                    )}

                    <div className="flex items-center gap-1">
                        {value && clearable && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="flex items-center justify-center h-4 w-4 rounded-sm hover:bg-muted transition-colors"
                                tabIndex={-1}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </div>
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={listRef}
                    className={cn(
                        "absolute z-50 w-full mt-1 bg-background border-0 border rounded-md shadow-lg",
                        "animate-in fade-in-0 zoom-in-95 duration-200"
                    )}
                    style={{ maxHeight }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            {emptyText || t('ui_components.no_results_found')}
                        </div>
                    ) : (
                        <div
                            className="py-1 overflow-y-auto"
                            style={{ maxHeight: "224px" }}
                            role="listbox"
                        >
                            {filteredOptions.map((option, index) => (
                                <div
                                    key={option.value}
                                    ref={el => { optionRefs.current[index] = el; }}
                                    onClick={() => handleSelect(option)}
                                    className={cn(
                                        "relative flex items-center px-3 py-2 text-sm cursor-pointer transition-colors",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        highlightedIndex === index && "bg-accent text-accent-foreground",
                                        value?.value === option.value && "bg-primary/10 text-primary font-medium",
                                        option.disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                    role="option"
                                    aria-selected={value?.value === option.value}
                                    aria-disabled={option.disabled}
                                >
                                    <span className="flex-1 truncate">{option.label}</span>
                                    {value?.value === option.value && (
                                        <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}