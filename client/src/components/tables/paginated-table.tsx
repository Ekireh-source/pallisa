"use client";
import { Suspense, Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	DependencyList,
	RefObject,
	ReactNode,
	useCallback,
	useEffect,
	useState,
	useRef,
	useMemo,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn, forceUrlToHttps } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";
import { EmptyState } from "./emptystate";
import { toast } from "sonner";
import { IPaginatedResponse } from "@/types";

type FetchFromUrlFn<T> = (args: {
	url: string;
}) => Promise<IPaginatedResponse<T>> | undefined;
type FetchFirstPageFn<T, Q> = (query?: Q) => Promise<IPaginatedResponse<T>>;

export type ColumnDef<T> = {
	key: string;
	header: ReactNode;
	cell: (item: T) => ReactNode;
	className?: string;
	cellClassName?: string;
	sortable?: {
		field: string;
		label: string;
	};
};

export type PaginatedTableProps<T, Q = unknown> = {
	fetchFirstPage: FetchFirstPageFn<T, Q>;
	fetchFromUrl?: FetchFromUrlFn<T>;
	query?: Q;
	deps?: DependencyList;
	paginated?: boolean;
	className?: string;
	tableClassName?: string;
	footerClassName?: string;
	showFooter?: boolean;
	onError?: (err: unknown) => void;
	columns: ColumnDef<T>[];
	emptyState?: ReactNode;
	skeletonRows?: number;
	refreshRef?: RefObject<(() => void) | null>;
	onSortChange?: (sortField: string, direction: "asc" | "desc") => void;
	showRowNumbers?: boolean;
	groupBy?: keyof T | string;
	groupLabel?: (groupValue: any) => ReactNode;
	renderRowSeparator?: (item: T, prevItem: T | null) => ReactNode;
};

function PaginatedTableInner<T, Q = unknown>({
	fetchFirstPage,
	fetchFromUrl,
	query,
	deps = [],
	paginated = true,
	className,
	tableClassName,
	footerClassName,
	showFooter = true,
	onError,
	columns,
	emptyState,
	skeletonRows = 5,
	refreshRef,
	onSortChange,
	showRowNumbers = true,
	groupBy,
	groupLabel,
	renderRowSeparator,
}: PaginatedTableProps<T, Q>) {
	const [data, setData] = useState<IPaginatedResponse<T> | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPageUrl, setCurrentPageUrl] = useState<string | null>(null);
	const [hasInitiallyMounted, setHasInitiallyMounted] = useState<boolean>(true);
	const [currentSort, setCurrentSort] = useState<{
		field: string;
		direction: "asc" | "desc";
	} | null>(null);
	const [pageSize, setPageSize] = useState<number>(10);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const searchParamsRef = useRef(searchParams);
	const pathnameRef = useRef(pathname);
	const routerRef = useRef(router);
	const hasInitiallyMountedRef = useRef(true);
	const lastNonPageParamsRef = useRef<string>("");
	const [currentPageNum, setCurrentPageNum] = useState(1);

	useEffect(() => {
		searchParamsRef.current = searchParams;
		pathnameRef.current = pathname;
		routerRef.current = router;
	}, [searchParams, pathname, router]);

	useEffect(() => {
		let newPageNum = 1;
		const pageParam = searchParamsRef.current.get("page");
		if (pageParam) {
			const pageNum = parseInt(pageParam, 10);
			if (!isNaN(pageNum) && pageNum > 0) {
				newPageNum = pageNum;
			}
		}

		if (data?.previous) {
			try {
				const prevUrl = new URL(forceUrlToHttps(data.previous));
				const prevPageParam = prevUrl.searchParams.get("page");
				if (prevPageParam) {
					const prevPage = parseInt(prevPageParam, 10);
					if (!isNaN(prevPage) && prevPage > 0) {
						newPageNum = prevPage + 1;
					}
				}
			} catch (e) {

			}
		}

		if (data?.next) {
			try {
				const nextUrl = new URL(forceUrlToHttps(data.next));
				const nextPageParam = nextUrl.searchParams.get("page");
				if (nextPageParam) {
					const nextPage = parseInt(nextPageParam, 10);
					if (!isNaN(nextPage) && nextPage > 0) {
						newPageNum = nextPage - 1;
					}
				}
			} catch (e) {
				// URL parsing failed, fall back to default
			}
		}
		if (!data?.next && !data?.previous) {
			newPageNum = 1;
		}

		if (hasInitiallyMountedRef.current && pageParam) {
			const pageNum = parseInt(pageParam, 10);
			if (!isNaN(pageNum) && pageNum > 0) {
				newPageNum = pageNum;
			}
		}
		setCurrentPageNum(newPageNum);
		updateUrlWithPage(newPageNum);
	}, [data]);

	const handleError = (err: unknown) => {
		if (onError) onError(err);
		else toast.error("Failed to fetch data", { description: err instanceof Error ? err.message : String(err) });
	};

	const buildQueryFromUrl = useCallback((): Partial<Q> & { page?: number } => {
		const urlQuery: Partial<Q> & { page?: number } = {};

		searchParamsRef.current.forEach((value, key) => {
			if (key === "page") {
				urlQuery.page = parseInt(value, 10) || 1;
			} else {
				(urlQuery as any)[key] = value;
			}
		});
		return urlQuery;
	}, []);



	const updateUrlWithPage = useCallback(
		(page: number | null) => {
			if (!paginated) return;

			const params = new URLSearchParams(searchParamsRef.current.toString());
			if (page && page > 1) {
				params.set("page", page.toString());
			} else {
				params.delete("page");
			}

			const nextQuery = params.toString();
			const currentQuery = searchParamsRef.current.toString();
			if (nextQuery === currentQuery) {
				return;
			}

			const newUrl = `${pathnameRef.current}${nextQuery ? `?${nextQuery}` : ""}`;
			routerRef.current.replace(newUrl, { scroll: false });
		},
		[paginated],
	);

	// Refresh function handles page reset logic
	const refresh = useCallback(async () => {
		if (!fetchFirstPage) return;
		setLoading(true);

		try {
			const urlQuery = buildQueryFromUrl();

			const currentParams = new URLSearchParams(searchParamsRef.current.toString());
			const currentNonPageParams = new URLSearchParams(currentParams.toString());
			currentNonPageParams.delete("page");
			const currentQueryWithoutPage = currentNonPageParams.toString();

			if (currentQueryWithoutPage !== lastNonPageParamsRef.current) {
				lastNonPageParamsRef.current = currentQueryWithoutPage;
				updateUrlWithPage(1);
			}

			const mergedQuery = {
				...query,
				...urlQuery,
			} as Q;

			const res = await fetchFirstPage(mergedQuery);

			if (res) {
				setData(res);
			}
		} catch (e) {
			handleError(e);
		} finally {
			setLoading(false);

			if (!hasInitiallyMountedRef.current) {
				hasInitiallyMountedRef.current = false;
				setHasInitiallyMounted(false);
			}
		}
	}, [fetchFirstPage, query, pageSize, buildQueryFromUrl, updateUrlWithPage]);

	const goPrev = useCallback(async () => {
		if (!fetchFromUrl || !data?.previous) return;
		setLoading(true);
		try {
			const previousUrl = forceUrlToHttps(data.previous);
			const res = await fetchFromUrl({ url: previousUrl });
			if (res) {
				setData(res);
				setCurrentPageUrl(previousUrl);

				try {
					const urlObj = new URL(previousUrl);
					const p = urlObj.searchParams.get("page");
					const newPageNum = p ? parseInt(p, 10) : 1;
					if (!isNaN(newPageNum)) {
						updateUrlWithPage(newPageNum);
					}
				} catch (e) { }
			}
		} catch (e) {
			handleError(e);
		} finally {
			setLoading(false);
			hasInitiallyMountedRef.current = false;
		}
	}, [data?.previous, fetchFromUrl, updateUrlWithPage, pageSize]);

	const goNext = useCallback(async () => {
		if (!fetchFromUrl || !data?.next) return;
		setLoading(true);
		try {
			const nextUrl = forceUrlToHttps(data.next);
			const res = await fetchFromUrl({ url: nextUrl });
			if (res) {
				setData(res);
				setCurrentPageUrl(nextUrl);

				// Extract page number from URL if possible
				try {
					const urlObj = new URL(nextUrl);
					const p = urlObj.searchParams.get("page");
					const newPageNum = p ? parseInt(p, 10) : 1;
					if (!isNaN(newPageNum)) {
						updateUrlWithPage(newPageNum);
					}
				} catch (e) { }
			}
		} catch (e) {
			handleError(e);
		} finally {
			setLoading(false);
			hasInitiallyMountedRef.current = false;
		}
	}, [data?.next, fetchFromUrl, updateUrlWithPage, pageSize]);

	useEffect(() => {
		if (refreshRef) {
			refreshRef.current = refresh;
		}
	}, [refresh, refreshRef]);

	useEffect(() => {
		// If it's the very first mount (no data), fetch immediately
		// Otherwise, use a debounce delay to avoid spamming refreshes on fast filter changes
		const delay = !data ? 0 : (paginated ? 800 : 100);
		const timer = setTimeout(() => latestRefresh.current(), delay);
		return () => clearTimeout(timer);
	}, [JSON.stringify(deps), pageSize]);

	useEffect(() => {
		setCurrentPageUrl(null);
	}, [JSON.stringify(deps)]);

	const latestRefresh = useRef(refresh);
	useEffect(() => {
		latestRefresh.current = refresh;
	}, [refresh]);



	const sortableColumns = columns.filter((col) => col.sortable);

	const sortOptions = sortableColumns.flatMap((col) => [
		{
			value: `${col.sortable!.field}_asc`,
			label: col.sortable!.label,
			field: col.sortable!.field,
			direction: "asc" as const,
			icon: (
				<Icon
					icon="hugeicons:arrow-up-05"
					width="16"
					height="16"
					className="text-muted-foreground"
				/>
			),
		},
		{
			value: `${col.sortable!.field}_desc`,
			label: col.sortable!.label,
			field: col.sortable!.field,
			direction: "desc" as const,
			icon: (
				<Icon
					icon="hugeicons:arrow-down-05"
					width="16"
					height="16"
					className="text-muted-foreground"
				/>
			),
		},
	]);

	const defaultOption = {
		value: "default",
		label: "Default",
		field: "",
		direction: "asc" as const,
		icon: null,
	};

	const allSortOptions = [defaultOption, ...sortOptions];

	const currentSortDisplay = currentSort
		? sortableColumns.find((col) => col.sortable?.field === currentSort.field)?.sortable?.label ||
		"Custom"
		: "Default";

	const pageSizeOptions = [10, 20, 50, 100];

	// Calculate the starting row number for the current page
	const getRowNumber = (index: number) => {
		return (currentPageNum - 1) * pageSize + index + 1;
	};

	// Group data by the specified field
	const groupedData = useMemo(() => {
		if (!groupBy || !data?.results) return { groups: [], ungrouped: [], flat: data?.results || [] };

		const groups: Record<string, T[]> = {};
		let ungrouped: T[] = [];
		data.results.forEach((item: any) => {
			const groupKey = item[groupBy];
			if (!groupKey || groupKey === 'ungrouped' || groupKey === '') {
				ungrouped.push(item);
			} else {
				if (!groups[groupKey]) {
					groups[groupKey] = [];
				}
				groups[groupKey].push(item);
			}
		});

		const groupEntries = Object.entries(groups).map(([key, items]) => ({ key, items }));

		// Initialize expanded groups with all group keys
		const groupKeys = groupEntries.map(({ key }) => key);
		setExpandedGroups(new Set(groupKeys));

		return {
			groups: groupEntries,
			ungrouped,
			flat: data.results,
		};
	}, [groupBy, data?.results]);

	const toggleGroup = (groupKey: string) => {
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) {
				next.delete(groupKey);
			} else {
				next.add(groupKey);
			}
			return next;
		});
	};

	return (
		<div className={cn("space-y-4 h-full !min-h-[30svh]", className)}>
			{/* Desktop View */}
			<div className="hidden md:block w-full overflow-x-auto max-w-full">
				<Table className={cn(tableClassName, "mb-auto min-w-full")}>
					<TableHeader>
						<TableRow className="border-b border-gray-200">
							{showRowNumbers && <TableHead className="whitespace-nowrap w-[0.5rem] !text-black !text-[16px]">No</TableHead>}
							{columns.map((col) => (
								<TableHead key={col.key} className={cn("whitespace-nowrap !text-My-Black !text-[16px]", col.className)}>
									{col.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: skeletonRows }).map((_, rowIndex) => (
								<TableRow key={rowIndex} className="border-b">
									{showRowNumbers && (
										<TableCell className="w-[0.5rem]">
											<Skeleton className="h-4 sm:h-6 w-8" />
										</TableCell>
									)}
									{columns.map((col) => (
										<TableCell key={col.key}>
											<Skeleton className="h-4 sm:h-6 w-3/4" />
										</TableCell>
									))}
								</TableRow>
							))
						) : (!loading && data && (data.results?.length ?? 0) === 0) ? (
							<TableRow>
								<TableCell
									colSpan={columns.length + (showRowNumbers ? 1 : 0)}
									className="text-center py-8 sm:py-12"
								>
									{emptyState ?? (
										<EmptyState />
									)}
								</TableCell>
							</TableRow>
						) : groupBy ? (
							(() => {
								let lastItem: T | null = null;
								const ungroupedItems = groupedData.ungrouped.map((item, index) => {
									const prevItem = lastItem;
									lastItem = item;
									const separator = renderRowSeparator?.(item, prevItem);
									return (
										<Fragment key={(item as any)?.id || `ungrouped-${index}`}>
											{separator && (
												<TableRow className="border-none hover:bg-transparent">
													<TableCell colSpan={columns.length + (showRowNumbers ? 1 : 0)} className="p-0">
														{separator}
													</TableCell>
												</TableRow>
											)}
											<TableRow className="hover:bg-muted/50 transition-colors border-b">
												{showRowNumbers && (
													<TableCell className="w-[0.5rem]">{getRowNumber(index)}</TableCell>
												)}
												{columns.map((col) => (
													<TableCell key={col.key} className={cn("whitespace-normal break-words", col.cellClassName)}>
														{col?.cell?.(item)}
													</TableCell>
												))}
											</TableRow>
										</Fragment>
									);
								});

								const groupedItems = groupedData.groups.map(({ key, items }) => (
									<Fragment key={key}>
										<TableRow className="bg-[#F7F7FB] transition-colors">
											<TableCell colSpan={columns.length + (showRowNumbers ? 1 : 0)} className="py-3 rounded-lg">
												<button
													onClick={() => toggleGroup(key)}
													className="flex items-center gap-2 w-full text-left"
												>
													<Icon
														icon={expandedGroups.has(key) ? "hugeicons:arrow-down-01" : "hugeicons:arrow-right-01"}
														className="w-4 h-4 text-gray-600 transition-transform"
													/>
													<span className="font-semibold text-gray-900">
														{groupLabel ? groupLabel(key) : key}
													</span>
													<span className="text-sm text-gray-500">({items.length})</span>
												</button>
											</TableCell>
										</TableRow>
										{expandedGroups.has(key) && items.map((item, itemIndex) => {
											const prevItem = lastItem;
											lastItem = item;
											const separator = renderRowSeparator?.(item, prevItem);
											return (
												<Fragment key={(item as any)?.id || `${key}-${itemIndex}`}>
													{separator && (
														<TableRow className="border-none hover:bg-transparent">
															<TableCell colSpan={columns.length + (showRowNumbers ? 1 : 0)} className="p-0">
																{separator}
															</TableCell>
														</TableRow>
													)}
													<TableRow className="bg-[#F7F7FB]/50 hover:bg-muted/50 transition-colors border-b">
														{showRowNumbers && (
															<TableCell className="w-2">{getRowNumber(itemIndex)}</TableCell>
														)}

														{columns.map((col) => (
															<TableCell key={col.key} className={cn("whitespace-normal break-words pl-6", col.cellClassName)}>
																{col?.cell?.(item)}
															</TableCell>
														))}
													</TableRow>
												</Fragment>
											);
										})}
									</Fragment>
								));

								return <>{ungroupedItems}{groupedItems}</>;
							})()
						) : (
							// Flat rendering (default)
							data?.results?.map((item: any, index: number) => {
								const prevItem = index > 0 ? data.results![index - 1] : null;
								const separator = renderRowSeparator?.(item, prevItem);
								return (
									<Fragment key={(item as any)?.id || index}>
										{separator && (
											<TableRow className="border-none hover:bg-transparent">
												<TableCell colSpan={columns.length + (showRowNumbers ? 1 : 0)} className="p-0">
													{separator}
												</TableCell>
											</TableRow>
										)}
										<TableRow className="hover:bg-muted/50 transition-colors border-b">
											{showRowNumbers && (
												<TableCell className="w-2">{getRowNumber(index)}</TableCell>
											)}
											{columns.map((col) => (
												<TableCell key={col.key} className={cn("whitespace-normal break-words", col.cellClassName)}>
													{col?.cell?.(item)}
												</TableCell>
											))}
										</TableRow>
									</Fragment>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Mobile View */}
			<div className="md:hidden flex flex-col gap-4">
				{loading ? (
					Array.from({ length: skeletonRows }).map((_, index) => (
						<div key={index} className="bg-white rounded-[12px] border-[0.5px] border-gray-200 p-[14px] flex items-center justify-between gap-4">
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
							<Skeleton className="h-8 w-8 rounded-full" />
						</div>
					))
				) : (!loading && data && (data.results?.length ?? 0) === 0) ? (
					<div className="py-8 text-center bg-white rounded-[12px] border-[0.5px] border-gray-200">
						{emptyState ?? <EmptyState />}
					</div>
				) : groupBy ? (
					(() => {
						let lastItem: T | null = null;
						const ungroupedItems = groupedData.ungrouped.map((item, index) => {
							const prevItem = lastItem;
							lastItem = item;
							const separator = renderRowSeparator?.(item, prevItem);
							return (
								<Fragment key={(item as any)?.id || `ungrouped-mob-${index}`}>
									{separator && <div className="py-2">{separator}</div>}
									<div className="bg-white rounded-[12px] border-[0.5px] border-gray-200 p-4 shadow-sm flex flex-col">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0 overflow-hidden">
												{columns[0]?.cell?.(item)}
											</div>
											{columns.length > 1 && (
												<div className="shrink-0 flex items-center justify-end">
													{columns[columns.length - 1]?.cell?.(item)}
												</div>
											)}
										</div>
										{columns.length > 2 && (
											<div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 pt-3 border-t border-gray-100">
												{columns.slice(1, columns.length - 1).map((col) => (
													<div key={col.key} className={cn("flex items-center", col.cellClassName)}>
														{col?.cell?.(item)}
													</div>
												))}
											</div>
										)}
									</div>
								</Fragment>
							);
						});

						const groupedItems = groupedData.groups.map(({ key, items }) => (
							<Fragment key={key}>
								<div
									onClick={() => toggleGroup(key)}
									className="bg-[#F7F7FB] rounded-lg p-3 flex items-center gap-2 w-full text-left font-semibold text-gray-900 cursor-pointer"
								>
									<Icon
										icon={expandedGroups.has(key) ? "hugeicons:arrow-down-01" : "hugeicons:arrow-right-01"}
										className="w-4 h-4 text-gray-600 transition-transform"
									/>
									<span>{groupLabel ? groupLabel(key) : key}</span>
									<span className="text-sm text-gray-500">({items.length})</span>
								</div>
								{expandedGroups.has(key) && (
									<div className="flex flex-col gap-3 pl-4">
										{items.map((item, itemIndex) => {
											const prevItem = lastItem;
											lastItem = item;
											const separator = renderRowSeparator?.(item, prevItem);
											return (
												<Fragment key={(item as any)?.id || `${key}-mob-${itemIndex}`}>
													{separator && <div className="py-2">{separator}</div>}
													<div className="bg-white rounded-[12px] border-[0.5px] border-gray-200 p-4 shadow-sm flex flex-col">
														<div className="flex items-start justify-between gap-4">
															<div className="flex-1 min-w-0 overflow-hidden">
																{columns[0]?.cell?.(item)}
															</div>
															{columns.length > 1 && (
																<div className="shrink-0 flex items-center justify-end">
																	{columns[columns.length - 1]?.cell?.(item)}
																</div>
															)}
														</div>
														{columns.length > 2 && (
															<div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 pt-3 border-t border-gray-100">
																{columns.slice(1, columns.length - 1).map((col) => (
																	<div key={col.key} className={cn("flex items-center", col.cellClassName)}>
																		{col?.cell?.(item)}
																	</div>
																))}
															</div>
														)}
													</div>
												</Fragment>
											);
										})}
									</div>
								)}
							</Fragment>
						));

						return <>{ungroupedItems}{groupedItems}</>;
					})()
				) : (
					data?.results?.map((item: any, index: number) => {
						const prevItem = index > 0 ? data.results![index - 1] : null;
						const separator = renderRowSeparator?.(item, prevItem);
						return (
							<Fragment key={(item as any)?.id || `mob-${index}`}>
								{separator && <div className="py-2">{separator}</div>}
								<div className="bg-white rounded-[12px] border-[0.5px] border-gray-200 p-4 shadow-sm flex flex-col">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0 overflow-hidden">
											{columns[0]?.cell?.(item)}
										</div>
										{columns.length > 1 && (
											<div className="shrink-0 flex items-center justify-end">
												{columns[columns.length - 1]?.cell?.(item)}
											</div>
										)}
									</div>
									{columns.length > 2 && (
										<div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 pt-3 border-t border-gray-100">
											{columns.slice(1, columns.length - 1).map((col) => (
												<div key={col.key} className={cn("flex items-center", col.cellClassName)}>
													{col?.cell?.(item)}
												</div>
											))}
										</div>
									)}
								</div>
							</Fragment>
						);
					})
				)}
			</div>

			{showFooter && data && (data.next || data.previous) && paginated && (
				<div
					className={cn(
						"flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-2 mt-auto",
						footerClassName,
					)}
				>
					<p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
						Showing {data.results?.length ?? 0} of {data.count ?? 0} total
					</p>

					{/* Always show pagination controls if data exists */}
					{/* {data.results.length === data.count && !data.next ? (
						<></>
					) : ( */}
					<div className="flex items-center gap-1 sm:gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={goPrev}
							disabled={!data.previous || loading}
							className="rounded-xl text-xs h-8 sm:h-9 px-2 sm:px-3"
						>
							<ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
							<span className="hidden sm:inline">Previous</span>
							<span className="sm:hidden">Prev</span>
						</Button>
						{currentPageNum && (
							<Button
								size="sm"
								className="rounded-xl text-xs sm:text-sm font-medium h-8 sm:h-9 px-3 sm:px-4"
							>
								{currentPageNum}
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={goNext}
							disabled={!data.next || loading}
							className="rounded-xl text-xs h-8 sm:h-9 px-2 sm:px-3"
						>
							<span className="hidden sm:inline">Next</span>
							<span className="sm:hidden">Next</span>
							<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
						</Button>
					</div>
					{/* )} */}
				</div>
			)}
		</div>
	);
}

export function PaginatedTable<T, Q = unknown>(props: PaginatedTableProps<T, Q>) {
	return (
		<Suspense fallback={null}>
			<PaginatedTableInner<T, Q> {...props} />
		</Suspense>
	);
}

export default PaginatedTable;
