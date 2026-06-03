"use client";
import * as React from "react";
import { ChevronDown, X, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { IPaginatedResponse } from "@/types";

export type PaginatedSelectItem<T> = T;

export interface PaginatedSelectItemWithIdValueLabel {
    id: string | number;
    value: string;
    label: string;
}

export type FetchFirstPageFn<T, Q = unknown> = (query?: Q) => Promise<IPaginatedResponse<T>>;
export type FetchFromUrlFn<T> = (args: { url: string }) => Promise<IPaginatedResponse<T>>;

export interface PaginatedSearchableSelectProps<T, Q = unknown> {
    paginated?: boolean;
    fetchFirstPage?: FetchFirstPageFn<T, Q>;
    fetchFromUrl?: FetchFromUrlFn<T>;
    query?: Q;
    deps?: React.DependencyList;
    refreshTrigger?: React.RefObject<(() => void) | null> | React.MutableRefObject<(() => void) | null>;
    getItemId: (item: T) => string | number;
    getItemValue: (item: T) => string;
    getItemLabel: (item: T) => string;
    initialItems?: PaginatedSelectItemWithIdValueLabel[];
    defaultLabel?: string;
    selectedItems?: (string | number)[];
    onSelect: (itemIds: (string | number)[], _item: PaginatedSelectItem<T>[]) => void;
    onRemove: (itemId: (string | number)[]) => void;
    showSelectedItems?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    className?: string;
    outerContainerClassName?: string;
    triggerClassName?: string;
    popoverClassName?: string;
    itemsSelectClassName?: string;
    placeholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    hideSelectedFromList?: boolean;
    setParentItems?: (items: PaginatedSelectItem<T>[]) => void;
    id?: string;
    required?: boolean;
    disableSelectAll?: boolean;
    showSelectedItemsOnTop?: boolean;
    label?: string;
    renderItem?: (item: T) => React.ReactNode;
    renderSelectedItem?: (item: T) => React.ReactNode;

}

export function PaginatedSearchableSelect<T, Q = unknown>({
    paginated = true,
    fetchFirstPage,
    fetchFromUrl,
    query,
    deps = [],
    refreshTrigger,
    getItemId,
    getItemValue,
    getItemLabel,
    initialItems: staticItems = [],
    selectedItems = [],
    onSelect,
    onRemove,
    multiple = false,
    disabled = false,
    className = "",
    outerContainerClassName = "",
    triggerClassName = "",
    popoverClassName = "",
    itemsSelectClassName = "",
    placeholder = "Select an item",
    emptyMessage = "No items found.",
    setParentItems,
    disableSelectAll = false,
    showSelectedItemsOnTop = true,
    label,
    renderItem,
    renderSelectedItem,

}: PaginatedSearchableSelectProps<T, Q>) {
    // State
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<IPaginatedResponse<PaginatedSelectItem<T>> | null>(null);
    const [search, setSearch] = React.useState("");

    // Refs
    const listRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Convert API results to standardized format
    const standardDataItems = React.useMemo<PaginatedSelectItemWithIdValueLabel[]>(() => {
        if (!data?.results) return staticItems;

        const apiItems = data.results.map(res => ({
            id: getItemId(res),
            value: getItemValue(res),
            label: getItemLabel(res),
        }));

        // Merge with static items, avoiding duplicates
        const mergedItems = [...staticItems];
        apiItems.forEach(apiItem => {
            if (!mergedItems.some(item => item.id === apiItem.id)) {
                mergedItems.push(apiItem);
            }
        });

        return mergedItems;
    }, [data?.results, staticItems, getItemId, getItemValue, getItemLabel]);

    // Get selected item for single-select mode
    const selectedItem = React.useMemo(() => {
        if (multiple || !selectedItems.length) return null;
        return standardDataItems.find(item => item.id === selectedItems[0] || String(item.id) === String(selectedItems[0])) || null;
    }, [multiple, selectedItems, standardDataItems]);

    // Filter and order items based on search and selection
    const orderedItems = React.useMemo(() => {
        let filtered = standardDataItems;

        // Apply search filter
        if (search.trim()) {
            filtered = filtered.filter(item =>
                item.label.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Separate selected and unselected items
        const selected = filtered.filter(item =>
            selectedItems.includes(item.id) || selectedItems.includes(String(item.id))
        );
        const unselected = filtered.filter(item =>
            !selectedItems.includes(item.id) && !selectedItems.includes(String(item.id))
        );

        return [...selected, ...unselected];
    }, [standardDataItems, selectedItems, search]);

    // Check if all/some visible items are selected
    const selectionState = React.useMemo(() => {
        if (!orderedItems.length) return { all: false, some: false };

        const allSelected = orderedItems.every(item =>
            selectedItems.includes(item.id) || selectedItems.includes(String(item.id))
        );
        const someSelected = orderedItems.some(item =>
            selectedItems.includes(item.id) || selectedItems.includes(String(item.id))
        );

        return { all: allSelected, some: someSelected };
    }, [orderedItems, selectedItems]);

    // Handle search with debouncing
    const handleSearchChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    // Fetch data
    const fetchData = React.useCallback(async (searchQuery: string) => {
        if (!fetchFirstPage) return;

        setLoading(true);
        try {
            const res = await fetchFirstPage({ search: searchQuery, ...query } as Q);
            setData(res);
        } catch (error) {
            toast.error("Failed to load items");
            console.warn(error);
        } finally {
            setLoading(false);
        }
    }, [fetchFirstPage, query]);

    // Fetch more data for infinite scroll
    const fetchMoreData = React.useCallback(async () => {
        if (!data?.next || !fetchFromUrl || loading) return;

        setLoading(true);
        try {
            const res = await fetchFromUrl({ url: data.next });
            setData(prev => ({
                ...res,
                results: [...(prev?.results || []), ...res.results],
            }));
        } catch (error) {
            toast.error("Failed to load more items");
            console.warn(error);
        } finally {
            setLoading(false);
        }
    }, [data?.next, fetchFromUrl, loading]);

    // Handle select
    const handleSelect = React.useCallback((itemId: string | number) => {
        const item = data?.results.find(i => getItemId(i) === itemId);
        if (!item) return;

        if (multiple && selectedItems.includes(itemId)) {
            onRemove([itemId]);
        } else {
            onSelect([itemId], [item]);
            if (!multiple) setOpen(false);
        }
    }, [data?.results, getItemId, multiple, selectedItems, onSelect, onRemove]);

    // Handle select all
    const handleSelectAll = React.useCallback(() => {
        if (!orderedItems.length) return;

        const allSelected = orderedItems.every(item =>
            selectedItems.includes(item.id) || selectedItems.includes(String(item.id))
        );

        if (allSelected) {
            onRemove(orderedItems.map(it => it.id));
        } else {
            const newItems = orderedItems.filter(item =>
                !selectedItems.includes(item.id) && !selectedItems.includes(String(item.id))
            );
            const dataItems = data?.results.filter(item =>
                newItems.some(it => getItemId(item) === it.id)
            ) || [];
            onSelect(newItems.map(it => it.id), dataItems);
        }
    }, [orderedItems, selectedItems, data?.results, getItemId, onSelect, onRemove]);

    // Clear all selections
    const clearAll = React.useCallback(() => {
        if (selectedItems.length) {
            onRemove(selectedItems);
        }
    }, [selectedItems, onRemove]);

    // Effect: Fetch initial data with debounced search
    React.useEffect(() => {
        if (!fetchFirstPage || (!paginated && data?.results)) return;

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchData(search);
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [paginated, fetchFirstPage, search, query, fetchData, ...deps]);

    // Effect: Setup intersection observer for infinite scroll
    React.useEffect(() => {
        if (!paginated || !data?.next || !sentinelRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    fetchMoreData();
                }
            },
            { root: listRef.current, rootMargin: "20px", threshold: 0.1 }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [paginated, data?.next, fetchMoreData]);

    // Effect: Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect: Focus search input when dropdown opens
    React.useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open]);

    // Effect: Expose refresh function via ref
    React.useEffect(() => {
        if (refreshTrigger && typeof refreshTrigger !== "function") {
            refreshTrigger.current = () => {
                setData(null);
                fetchData(search);
            };
        }
    }, [refreshTrigger, fetchData, search]);

    // Effect: Notify parent of data changes
    React.useEffect(() => {
        if (setParentItems && data?.results) {
            setParentItems(data.results);
        }
    }, [data?.results, setParentItems]);

    return (
        <div className={`gap-1 flex-1 ${outerContainerClassName}`}>
            {label && (
                <Label className="text-[16px] font-medium">
                    {label}
                </Label>
            )}
            {/* Selected items badges */}
            {showSelectedItemsOnTop && multiple && selectedItems.length > 0 && (
                <div className={`flex flex-wrap gap-1 py-1 ${itemsSelectClassName}`}>
                    {orderedItems
                        .filter(it => selectedItems.includes(it.id) || selectedItems.includes(String(it.id)))
                        .map(item => (
                            <Badge key={item.id} variant="secondary" className="text-xs py-1 px-2">
                                {item.label}
                                <button
                                    type="button"
                                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                                    onClick={() => onRemove([item.id])}
                                    disabled={disabled}
                                >
                                    <X className="h-3 w-3 text-destructive" />
                                </button>
                            </Badge>
                        ))}
                </div>
            )}

            <div className={cn("relative w-full", className)} ref={dropdownRef}>
                {/* Trigger button */}
                <div
                    className={cn(
                        "relative flex items-center justify-between w-full px-3 py-2 min-h-[46px] text-sm border border-input rounded-xl cursor-pointer hover:bg-accent/50 transition-colors",
                        disabled && "opacity-50 cursor-not-allowed",
                        triggerClassName
                    )}
                    onClick={() => !disabled && setOpen(!open)}
                >
                    {!multiple && !open && selectedItem ? (
                        <div className="flex-1 flex items-center gap-2 overflow-hidden">
                            {renderSelectedItem && data?.results.find(i => getItemId(i) === selectedItem.id) ? (
                                renderSelectedItem(data.results.find(i => getItemId(i) === selectedItem.id)!)
                            ) : (
                                <span className="truncate">{selectedItem.label}</span>
                            )}
                        </div>
                    ) : (
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={placeholder}
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && orderedItems.length > 0) {
                                    e.preventDefault();
                                    const firstItem = orderedItems.find(item => {
                                        const isSelected = selectedItems.includes(item.id) || selectedItems.includes(String(item.id));
                                        return !multiple || !isSelected;
                                    });
                                    if (firstItem) handleSelect(firstItem.id);
                                }
                            }}
                            className="flex-1  bg-transparent border-none outline-none placeholder:text-muted-foreground"
                            onClick={() => setOpen(true)}
                            disabled={disabled}
                        />
                    )}

                    <div className="flex items-center gap-2 absolute right-1">
                        {!multiple && selectedItems.length === 1 && selectedItem && (
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); clearAll(); }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        {multiple && selectedItems.length > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="bg-primary text-primary-foreground text-xs px-4 py-1 rounded-md font-medium">
                                    {selectedItems.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); clearAll(); }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        <div className="min-w-8 h-full min-h-6 flex items-center justify-center px-1">
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    open && "rotate-180"
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Dropdown content */}
                {open && (
                    <div
                        className={cn(
                            "absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl  !z-[60] max-h-64 overflow-hidden",
                            popoverClassName
                        )}
                    >
                        {/* Select All option */}
                        {multiple && !disableSelectAll && (
                            <div
                                className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer border-b border-border"
                                onClick={handleSelectAll}
                            >
                                <div className="flex items-center justify-center w-4 h-4 border border-input rounded-sm bg-background">
                                    {selectionState.all ? (
                                        <Check className="h-3 w-3 text-primary" />
                                    ) : selectionState.some ? (
                                        <Minus className="h-3 w-3 text-primary" />
                                    ) : null}
                                </div>
                                <span className="text-sm font-medium">Select All</span>
                            </div>
                        )}

                        {/* Items list */}
                        <div ref={listRef} className="max-h-48 overflow-y-auto">
                            {loading && orderedItems.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                            ) : orderedItems.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
                            ) : (
                                orderedItems.map(item => {
                                    const isSelected = selectedItems.includes(item.id) || selectedItems.includes(String(item.id));
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => handleSelect(item.id)}
                                        >
                                            <div className="flex items-center justify-center w-4 h-4 border border-input rounded-sm bg-background flex-shrink-0">
                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                            </div>
                                            {renderItem && data?.results.find(i => getItemId(i) === item.id) ? (
                                                renderItem(data.results.find(i => getItemId(i) === item.id)!)
                                            ) : (
                                                <span className={cn("text-sm truncate", isSelected && "font-medium")}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            {paginated && data?.next && <div ref={sentinelRef} className="h-3" />}
                            {loading && orderedItems.length > 0 && (
                                <div className="text-center py-2 text-xs text-gray-500">Loading more...</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaginatedSearchableSelect;
