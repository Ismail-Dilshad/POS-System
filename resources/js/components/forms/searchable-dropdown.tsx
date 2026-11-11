import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, Search, X } from 'lucide-react';
import {
    type FormEvent,
    type KeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type FetchFunction<TOption> = (query: string) => Promise<TOption[]>;

type OptionValueResolver<TOption> = (option: TOption) => string;
type OptionDescriptionResolver<TOption> = (
    option: TOption,
) => string | undefined | null;

type SearchableDropdownProps<TOption> = {
    label: string;
    value?: string;
    onValueChange: (value: string | undefined) => void;
    fetchOptions: FetchFunction<TOption>;
    getOptionValue?: OptionValueResolver<TOption>;
    getOptionLabel: OptionValueResolver<TOption>;
    getOptionDescription?: OptionDescriptionResolver<TOption>;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    loadingMessage?: string;
    initialOptions?: TOption[];
    disabled?: boolean;
    className?: string;
    allLabel?: string;
    clearButtonAriaLabel?: string;
    onOpenChange?: (isOpen: boolean) => void;
    labelClassName?: string;
    inputClassName?: string;
    selectionClassName?: string;
    dropdownClassName?: string;
    optionClassName?: string;
    allButtonClassName?: string;
};

const DEFAULT_LOADING_MESSAGE = 'Loading…';
const DEFAULT_EMPTY_MESSAGE = 'No items found';
const DEFAULT_CLEAR_LABEL = 'Clear selection';

export function SearchableDropdown<TOption>(
    props: SearchableDropdownProps<TOption>,
) {
    const {
        label,
        value,
        onValueChange,
        fetchOptions,
        getOptionValue,
        getOptionLabel,
        getOptionDescription,
        placeholder,
        searchPlaceholder,
        emptyMessage = DEFAULT_EMPTY_MESSAGE,
        loadingMessage = DEFAULT_LOADING_MESSAGE,
        initialOptions = [],
        disabled = false,
        className,
        allLabel,
        clearButtonAriaLabel = DEFAULT_CLEAR_LABEL,
        onOpenChange,
        labelClassName,
        inputClassName,
        selectionClassName,
        dropdownClassName,
        optionClassName,
        allButtonClassName,
    } = props;

    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<TOption[]>(initialOptions);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const isMounted = useRef(true);
    const fetchAbortRef = useRef<AbortController | null>(null);

    const resolvedGetOptionValue = useMemo<
        OptionValueResolver<TOption>
    >(() => {
        if (getOptionValue) return getOptionValue;
        return (option: TOption) => getOptionLabel(option);
    }, [getOptionValue, getOptionLabel]);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        const combined = [...options, ...initialOptions];
        return (
            combined.find(
                (option) => resolvedGetOptionValue(option) === value,
            ) ?? null
        );
    }, [value, options, initialOptions, resolvedGetOptionValue]);

    const selectedLabel = useMemo(() => {
        if (!value) return undefined;
        if (selectedOption) {
            return getOptionLabel(selectedOption);
        }
        return value;
    }, [value, selectedOption, getOptionLabel]);

    const selectedDescription = useMemo(() => {
        if (!selectedOption || !getOptionDescription) return undefined;
        return getOptionDescription(selectedOption);
    }, [selectedOption, getOptionDescription]);

    useEffect(() => {
        setOptions(initialOptions);
    }, [initialOptions]);

    useEffect(() => () => {
        isMounted.current = false;
        if (fetchAbortRef.current) {
            fetchAbortRef.current.abort();
        }
    }, []);

    const closeDropdown = useCallback(() => {
        setOpen(false);
        onOpenChange?.(false);
        setSearchTerm('');
    }, [onOpenChange]);

    const openDropdown = useCallback(() => {
        if (disabled) return;
        setOpen(true);
        onOpenChange?.(true);
    }, [disabled, onOpenChange]);

    const handleDocumentClick = useCallback((event: MouseEvent) => {
        if (!containerRef.current) return;
        if (containerRef.current.contains(event.target as Node)) return;
        closeDropdown();
    }, [closeDropdown]);

    useEffect(() => {
        if (!open) return;
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [open, handleDocumentClick]);

    const loadOptions = useCallback(
        async (query: string) => {
            if (disabled) {
                return;
            }

            if (fetchAbortRef.current) {
                fetchAbortRef.current.abort();
            }

            const controller = new AbortController();
            fetchAbortRef.current = controller;

            setLoading(true);

            try {
                const result = await fetchOptions(query);
                if (!isMounted.current || controller.signal.aborted) {
                    return;
                }
                setOptions(result);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }
                console.error('SearchableDropdown: failed to load options', error);
                if (isMounted.current) {
                    setOptions([]);
                }
            } finally {
                if (isMounted.current && !controller.signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [disabled, fetchOptions],
    );

    useEffect(() => {
        if (!open) return;
        const handler = window.setTimeout(() => {
            void loadOptions(searchTerm.trim());
        }, 250);
        return () => window.clearTimeout(handler);
    }, [open, searchTerm, loadOptions]);

    useEffect(() => {
        if (!open) return;
        if (options.length === 0) {
            void loadOptions('');
        }
    }, [open, options.length, loadOptions]);

    useEffect(() => {
        if (!open) return;
        window.requestAnimationFrame(() => {
            searchRef.current?.focus();
        });
    }, [open]);

    const handleSelect = useCallback(
        (option: TOption | null) => {
            if (option === null) {
                onValueChange(undefined);
                closeDropdown();
                return;
            }
            const resolvedValue = resolvedGetOptionValue(option);
            onValueChange(resolvedValue);
            closeDropdown();
        },
        [onValueChange, closeDropdown, resolvedGetOptionValue],
    );

    const handleInputFocus = useCallback(() => {
        openDropdown();
    }, [openDropdown]);

    const handleInputChange = useCallback(
        (event: FormEvent<HTMLInputElement>) => {
            setSearchTerm(event.currentTarget.value);
        },
        [],
    );

    const handleInputKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeDropdown();
            }
        },
        [closeDropdown],
    );

    const hasSelection = Boolean(value);

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative space-y-2 rounded-md p-2 transition-colors duration-200',
                className,
            )}
        >
            <Label className={cn('text-sm font-medium', labelClassName)}>
                {label}
            </Label>

            {hasSelection ? (
                <div
                    className={cn(
                        'flex items-center justify-between rounded-md border border-border bg-background p-3',
                        selectionClassName,
                    )}
                >
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                            {selectedLabel}
                        </span>
                        {selectedDescription ? (
                            <span className="truncate text-xs text-muted-foreground">
                                {selectedDescription}
                            </span>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleSelect(null)}
                        aria-label={clearButtonAriaLabel}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <Input
                        ref={searchRef}
                        value={searchTerm}
                        onFocus={handleInputFocus}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder={searchPlaceholder ?? placeholder ?? ''}
                        disabled={disabled}
                        className={cn('pr-10', inputClassName)}
                    />
                    <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
            )}

            {open && !hasSelection && !disabled && (
                <div
                    className={cn(
                        'absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-lg',
                        dropdownClassName,
                    )}
                >
                    {allLabel && (
                        <button
                            type="button"
                            className={cn(
                                'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                                allButtonClassName,
                            )}
                            onClick={() => handleSelect(null)}
                        >
                            <span>{allLabel}</span>
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {loadingMessage}
                        </div>
                    ) : options.length > 0 ? (
                        options.map((option) => {
                            const optionLabel = getOptionLabel(option);
                            if (!optionLabel) {
                                return null;
                            }
                            const optionValue = resolvedGetOptionValue(option);
                            const description = getOptionDescription?.(option);
                            return (
                                <button
                                    key={optionValue}
                                    type="button"
                                    className={cn(
                                        'flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                        optionClassName,
                                    )}
                                    onClick={() => handleSelect(option)}
                                >
                                    <span className="font-medium">
                                        {optionLabel}
                                    </span>
                                    {description ? (
                                        <span className="text-xs text-muted-foreground">
                                            {description}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                            {emptyMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
