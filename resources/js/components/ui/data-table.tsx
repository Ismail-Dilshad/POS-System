import React, { useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableProps, Column } from '@/types/table';
import { usePaginationShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useToast } from '@/components/ui/toast';
import { useVirtualizer } from '@tanstack/react-virtual';

function DataTable<T = Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage,
  className,
  onRowClick,
  rowClassName,
  pagination,
  sorting,
  title,
  subtitle,
  headerActions,
  virtualScrolling = false,
  rowHeight = 50,
}: DataTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const resolvedEmptyMessage = emptyMessage ?? t('common.no_data');

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    enabled: virtualScrolling && data.length > 50,
  });

  // Keyboard shortcuts for pagination
  usePaginationShortcuts({
    currentPage: pagination?.currentPage || 1,
    totalPages: pagination?.totalPages || 1,
    onPageChange: pagination?.onPageChange || (() => {}),
    enabled: !!pagination && !loading,
    target: tableRef.current,
    onNavigate: (direction, page) => {
      const directionMessages = {
        previous: t('ui_components.data_table.pagination.previous_page'),
        next: t('ui_components.data_table.pagination.next_page'),
        first: t('ui_components.data_table.pagination.first_page'),
        last: t('ui_components.data_table.pagination.last_page'),
        'page-up': t('ui_components.data_table.pagination.page_up'),
        'page-down': t('ui_components.data_table.pagination.page_down'),
      } as const;

      const message = directionMessages[direction as keyof typeof directionMessages] 
        || t('ui_components.data_table.pagination.page_number', { page });
      toast({
        title: t('ui_components.data_table.pagination.toast_title'),
        description: t('ui_components.data_table.pagination.toast_message', { message, page }),
        type: 'info',
        duration: 1500
      });
    }
  });

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      const value = column.accessor
        ? typeof column.accessor === 'function'
          ? column.accessor(row)
          : row[column.accessor]
        : row;
      return column.render(value, row, data.indexOf(row));
    }

    if (column.accessor) {
      const accessorValue = typeof column.accessor === 'function'
        ? column.accessor(row)
        : row[column.accessor];
      return accessorValue as React.ReactNode;
    }

    return '';
  };

  const handleSort = (columnKey: string) => {
    if (sorting?.onSort) {
      sorting.onSort(columnKey);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (!sorting?.sortBy || sorting.sortBy !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }

    return sorting.sortOrder === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const handleRowClick = (row: T, index: number) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  const getRowClassName = (row: T, index: number) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index);
    }
    return rowClassName || '';
  };

  return (
    <div 
      ref={tableRef}
      className={cn('w-full', className)}
      tabIndex={0}
      role="table"
  aria-label={title || t('ui_components.data_table.aria_label')}
    >
      <div className="bg-card text-card-foreground shadow-[0_-2px_8px_0_rgba(0,0,0,0.1),0_2px_8px_0_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_8px_0_rgba(0,0,0,0.3),0_2px_8px_0_rgba(0,0,0,0.3)] rounded-md">
        {(title || subtitle || headerActions) && (
          <div className="shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] bg-card text-card-foreground px-6 py-4 rounded-t-md">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold">{title}</h2>
                )}
              </div>
              <div className="flex items-center gap-4">
                {subtitle && (
                  <div className="text-sm text-muted-foreground">
                    {subtitle}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {pagination && !loading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      
                    </div>
                  )}
                  {headerActions && (
                    <div className="flex items-center gap-2">
                      {headerActions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.headerClassName,
                    column.sortable && 'cursor-pointer select-none'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {resolvedEmptyMessage}
                </TableCell>
              </TableRow>
            ) : virtualScrolling && data.length > 100 ? (
              // Virtual scrolling for large datasets
              <div
                ref={parentRef}
                className="h-96 overflow-auto"
                style={{ height: '400px' }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TableRow
                        className={cn(
                          onRowClick && 'cursor-pointer',
                          getRowClassName(data[virtualRow.index], virtualRow.index)
                        )}
                        onClick={() => handleRowClick(data[virtualRow.index], virtualRow.index)}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={column.className}
                          >
                            {getCellValue(data[virtualRow.index], column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Regular rendering for smaller datasets
              data.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    getRowClassName(row, index)
                  )}
                  onClick={() => handleRowClick(row, index)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.className}
                    >
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {pagination && (
          <div className="shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(0,0,0,0.3)] bg-card text-card-foreground rounded-b-md">
            <DataTablePagination pagination={pagination} />
          </div>
        )}
      </div>
    </div>
  );
}

interface DataTablePaginationProps {
  pagination: NonNullable<DataTableProps['pagination']>;
}

function DataTablePagination({ pagination }: DataTablePaginationProps) {
  const { t } = useTranslation();
  const {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    showInfo = true,
  } = pagination;

  const paginationRef = useRef<HTMLDivElement>(null);

  const showingFrom = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const showingTo = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers to show
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > delta + 2) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - delta - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div 
      ref={paginationRef}
      className="flex items-center justify-between px-6 py-4"
      role="navigation"
      aria-label={t('technical.table_pagination')}
    >
      {showInfo && (
        <div className="text-sm text-muted-foreground">
          {t('ui_components.data_table.showing_of', {
            from: showingFrom,
            to: showingTo,
            total: totalItems,
          })}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="h-8 px-3"
          aria-label={`Go to previous page (page ${currentPage - 1})`}
          title="Previous page (← arrow key)"
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-muted-foreground text-sm">...</span>
              ) : (
                <Button
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="min-w-[32px] h-8"
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                  title={`Go to page ${page} (${page} key)`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="h-8 px-3"
          aria-label={`Go to next page (page ${currentPage + 1})`}
          title="Next page (→ arrow key)"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export { DataTable, DataTablePagination };
export type { DataTableProps };