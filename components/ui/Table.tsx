"use client";

import React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  PaginationState,
  OnChangeFn,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';

// =============================================================================
// VISUAL PRIMITIVES
// =============================================================================
// Use these directly for simple static tables, or let DataTable compose them
// for you when you need sorting/filtering/pagination.

const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="overflow-x-auto w-full">
      <table ref={ref} className={cn("table", className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("text-base-content", className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={className} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={className} {...props} />
  )
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("hover", className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn("font-semibold", className)} {...props} />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={className} {...props} />
  )
);
TableCell.displayName = 'TableCell';

const TableEmpty = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & {
  colSpan: number;
  message?: string;
}>(
  ({ colSpan, message = "No data found", className, ...props }, ref) => (
    <tr ref={ref} className={className} {...props}>
      <td colSpan={colSpan} className="text-center p-8 text-base-content/50">
        {message}
      </td>
    </tr>
  )
);
TableEmpty.displayName = 'TableEmpty';

// =============================================================================
// SORT INDICATOR
// =============================================================================

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <span className="ml-1 inline-block">▲</span>;
  }
  if (direction === "desc") {
    return <span className="ml-1 inline-block">▼</span>;
  }
  // Unsorted but sortable — show faint indicator
  return <span className="ml-1 inline-block opacity-30">▲▼</span>;
}

// =============================================================================
// DATA TABLE
// =============================================================================
// Higher-level component that wires @tanstack/react-table into the primitives.
// Based on the patterns from STAPLE's Table.tsx but stripped of app-specific
// logic (custom search tokens, tooltips, STAPLE's Filter component).
//
// Apps can extend behavior via:
// - `globalFilterFn` — STAPLE can inject its special token matching here
// - `renderColumnFilter` — custom per-column filter UI
// - `pageSizeOptions` — customize pagination sizes

/**
 * Default global filter: simple case-insensitive substring match across
 * all string values in a row. Apps can override with `globalFilterFn`.
 */
// `any` here is the same deliberate tanstack-table generic-inference escape
// hatch as `columns` above — see that comment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultGlobalFilterFn: FilterFn<any> = (row, _columnId, filterValue) => {
  const search = String(filterValue ?? "").toLowerCase().trim();
  if (!search) return true;

  // Search all cell values as strings
  const rowValues = row.getAllCells()
    .map(cell => cell.getValue())
    .filter(Boolean)
    .map(v => String(v).toLowerCase())
    .join(" ");

  return rowValues.includes(search);
};

export interface DataTableProps<TData> {
  /** Column definitions — standard @tanstack/react-table ColumnDef array */
  // `any` here (not `unknown`) is deliberate: @tanstack/react-table infers
  // `useReactTable<TData>`'s TData generic from the shape of `columns`, and
  // `unknown` actively participates in that inference and collapses it to
  // `unknown` everywhere downstream (breaks `header.column`'s type in the
  // render below); `any` is inert during inference and leaves TData intact.
  // This is the same pattern tanstack-table's own docs use for generic
  // wrapper components.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  /** The data array to render */
  data: TData[];

  // --- Feature flags ---
  enableSorting?: boolean;
  enableFilters?: boolean;
  enableGlobalSearch?: boolean;
  enablePagination?: boolean;

  // --- Search ---
  globalSearchPlaceholder?: string;
  /** Override the default global filter function (e.g. STAPLE's special token search) */
  globalFilterFn?: FilterFn<TData>;

  // --- Pagination ---
  /** Controlled pagination (for server-side). Omit for client-side auto pagination. */
  manualPagination?: boolean;
  paginationState?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
  pageSizeOptions?: number[];

  // --- Callbacks ---
  onGlobalFilterChange?: (filter: string) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;

  // --- Customization ---
  /** Render a custom filter UI for a specific column */
  // `any` here is the same deliberate tanstack-table generic-inference escape
  // hatch as `columns` above — see that comment.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderColumnFilter?: (column: any) => React.ReactNode;
  /** Message shown when the table has no rows */
  emptyMessage?: string;
  className?: string;
}

function DataTable<TData>({
  columns,
  data,
  enableSorting = true,
  enableFilters = true,
  enableGlobalSearch = true,
  enablePagination = false,
  globalSearchPlaceholder = "Search...",
  globalFilterFn: customGlobalFilterFn,
  manualPagination = false,
  paginationState: controlledPagination,
  onPaginationChange: controlledOnPaginationChange,
  pageCount: controlledPageCount,
  pageSizeOptions = [5, 10, 20, 50],
  onGlobalFilterChange,
  onColumnFiltersChange,
  renderColumnFilter,
  emptyMessage = "No data found",
  className,
}: DataTableProps<TData>) {
  // --- Internal state ---
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSizeOptions[0] ?? 10,
  });

  const pagination = manualPagination
    ? (controlledPagination ?? { pageIndex: 0, pageSize: 10 })
    : internalPagination;

  const handlePaginationChange: OnChangeFn<PaginationState> = manualPagination
    ? (controlledOnPaginationChange ?? (() => {}))
    : setInternalPagination;

  // --- Table instance ---
  const table = useReactTable({
    data,
    columns,
    enableSorting,
    enableFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    manualPagination,
    pageCount: manualPagination ? controlledPageCount : undefined,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      // Propagate to parent if callback provided
      const next = typeof updater === "function" ? updater(columnFilters) : updater;
      onColumnFiltersChange?.(next);
    },
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(globalFilter) : updater;
      setGlobalFilter(next);
      onGlobalFilterChange?.(next);
    },
    onPaginationChange: handlePaginationChange,
    globalFilterFn: customGlobalFilterFn ?? defaultGlobalFilterFn,
    autoResetPageIndex: false,
  });

  // Reset to page 0 when filters change (client-side only)
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (enablePagination && !manualPagination) {
      table.setPageIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, columnFilters]);

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Global search */}
      {enableGlobalSearch && (
        <div className="flex justify-end">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={globalSearchPlaceholder}
            aria-label="Search table data"
            className="input input-bordered input-sm w-full max-w-xs bg-base-200"
          />
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <>
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIndicator direction={header.column.getIsSorted()} />
                        )}
                      </div>
                      {/* Per-column filter (if provided) */}
                      {header.column.getCanFilter() && renderColumnFilter
                        ? renderColumnFilter(header.column)
                        : null}
                    </>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableEmpty colSpan={columns.length} message={emptyMessage} />
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {enablePagination && table.getRowModel().rows.length > 0 && pageCount > 1 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="join">
            <button
              type="button"
              className="join-item btn btn-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              «
            </button>
            <button
              type="button"
              className="join-item btn btn-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              ‹
            </button>
            <button className="join-item btn btn-sm btn-disabled">
              Page {currentPage} of {pageCount}
            </button>
            <button
              type="button"
              className="join-item btn btn-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              ›
            </button>
            <button
              type="button"
              className="join-item btn btn-sm"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              »
            </button>
          </div>

          {/* Page size selector */}
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export {
  // Primitives (for static tables or custom compositions)
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  // High-level (tanstack-powered)
  DataTable,
  SortIndicator,
};

// Re-export tanstack types that consumers will need for column definitions
export type { ColumnDef, FilterFn, PaginationState, SortingState, ColumnFiltersState };
