"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  Row,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompactFilters } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/formatter";
import { TransactionOrTransfer } from "@/lib/types";
import { capitalize } from "@/lib/utils";
import { TransactionType } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ActiveFiltersDisplay, FilterSheet } from "./filter-sheet";
import { TransactionList } from "./transaction-list";
import { TransactionsEmptyState } from "./transactions-empty-state";

interface DataTableProps {
  columns: ColumnDef<TransactionOrTransfer>[];
  data: TransactionOrTransfer[];
  accounts: { id: number; name: string }[];
  categories: {
    id: number;
    name: string;
    icon?: string | null;
  }[];
  initialAccountFilter?: string;
  onConvertToTransfer?: (selectedRows: TransactionOrTransfer[]) => void;
  onDeleteSelected?: (selectedRows: TransactionOrTransfer[]) => void;
  onRowClick?: (row: TransactionOrTransfer) => void;
}

export function DataTable({
  columns,
  data,
  accounts,
  categories,
  initialAccountFilter,
  onDeleteSelected,
  onConvertToTransfer,
  onRowClick,
}: DataTableProps) {
  const useCompactFilterLayout = useCompactFilters();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    () =>
      initialAccountFilter
        ? [{ id: "account", value: initialAccountFilter }]
        : [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      id: false,
      select: true,
      date: true,
      source: true,
      account: true,
      type: false,
      category: true,
      createdAt: false,
      updatedAt: false,
      actions: true,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Add selection column
  const selectionColumn: ColumnDef<TransactionOrTransfer> = {
    id: "select",
    header: ({ table }) => (
      <div className="grid place-items-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean | "indeterminate") =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="grid place-items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean | "indeterminate") =>
            row.toggleSelected(!!value)
          }
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const table = useReactTable({
    data,
    columns: [selectionColumn, ...columns],
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  // Apply date filter when date range changes
  React.useEffect(() => {
    const dateColumn = table.getColumn("date");
    if (dateColumn) {
      if (dateRange.from || dateRange.to) {
        dateColumn.setFilterValue(dateRange);
      } else {
        dateColumn.setFilterValue(undefined);
      }
    }
  }, [dateRange, table]);

  const types = [...Object.values(TransactionType), "TRANSFER"];

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  const clearAllFilters = () => {
    table.getAllColumns().forEach((column) => {
      if (column.getCanFilter()) {
        column.setFilterValue("");
      }
    });
    setDateRange({ from: undefined, to: undefined });
  };

  const emptyState = (
    <TransactionsEmptyState
      hasData={data.length > 0}
      accounts={accounts}
      categories={categories}
      onClearFilters={clearAllFilters}
    />
  );

  const handleDeleteSelected = () => {
    if (onDeleteSelected && hasSelectedRows) {
      const selectedData = selectedRows.map(
        (row) => row.original as TransactionOrTransfer,
      );
      onDeleteSelected(selectedData);
      // Clear selection after deletion
      table.toggleAllPageRowsSelected(false);
    }
  };

  const pageRows = table.getRowModel().rows;

  // Date-grouped rows for the compact (@3xl:hidden) list view
  const listData = React.useMemo(() => {
    type RowData =
      | { type: "header"; date: string }
      | { type: "row"; row: Row<TransactionOrTransfer> };

    const groups: RowData[] = [];
    const dateGroups: { [key: string]: Row<TransactionOrTransfer>[] } = {};

    pageRows.forEach((row) => {
      const date = (row.original as { date?: Date }).date;
      if (date) {
        const dateKey = new Date(date).toDateString();
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(row);
      }
    });

    const sortedDates = Object.keys(dateGroups).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    sortedDates.forEach((dateKey) => {
      groups.push({ type: "header", date: dateKey });
      dateGroups[dateKey].forEach((row) => {
        groups.push({ type: "row", row });
      });
    });

    return groups;
  }, [pageRows]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center py-4 gap-2">
        {useCompactFilterLayout ? (
          <>
            <div className="flex items-center gap-2 w-full">
              <Input
                placeholder="Search transactions..."
                value={
                  (table
                    .getColumn("description")
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn("description")
                    ?.setFilterValue(event.target.value)
                }
                className="flex-1 max-w-sm"
              />
              <FilterSheet
                accounts={accounts}
                categories={categories}
                table={table}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </div>
            <div className="ml-auto hidden items-center space-x-2 pl-4 @3xl:flex">
              <p className="whitespace-nowrap text-sm font-medium">
                Rows per page
              </p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <Input
              placeholder="Search transactions..."
              value={
                (table.getColumn("description")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("description")
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      `${format(dateRange.from, "MMM dd")} - ${format(
                        dateRange.to,
                        "MMM dd",
                      )}`
                    ) : dateRange.from ? (
                      `From ${format(dateRange.from, "MMM dd")}`
                    ) : dateRange.to ? (
                      `Until ${format(dateRange.to, "MMM dd")}`
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) =>
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDateRange({ from: undefined, to: undefined })
                  }
                  className="h-8 px-2 lg:px-3"
                >
                  Clear
                </Button>
              )}
            </div>
            <Select
              value={
                (table.getColumn("account")?.getFilterValue() as string) ??
                "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("account")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map(({ id, name }) => (
                  <SelectItem key={id} value={id.toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={
                (table.getColumn("category")?.getFilterValue() as string) ??
                "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("category")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => {
                  return (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      <div className="w-4">
                        {category.icon && (
                          <DynamicIcon
                            name={
                              category.icon as keyof typeof dynamicIconImports
                            }
                            className="h-4 w-4"
                          />
                        )}
                      </div>
                      {category.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select
              value={
                (table.getColumn("type")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("type")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {capitalize(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 ml-auto pl-4">
              <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {hasSelectedRows && onDeleteSelected && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
          >
            Delete {selectedRows.length} selected
          </Button>
        )}
        {hasSelectedRows && onConvertToTransfer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onConvertToTransfer(selectedRows.map((row) => row.original))
            }
            disabled={selectedRows.length !== 2}
          >
            Convert to Transfer
          </Button>
        )}
        <div className="hidden @3xl:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {useCompactFilterLayout && (
        <div className="mb-4 w-full">
          <ActiveFiltersDisplay
            table={table}
            dateRange={dateRange}
            setDateRange={setDateRange}
            accounts={accounts}
            categories={categories}
          />
        </div>
      )}

      {pageRows.length === 0 ? (
        emptyState
      ) : (
        <>
          <div className="@3xl:hidden">
            <TransactionList items={listData} onRowClick={onRowClick} />
          </div>
          <div className="hidden overflow-x-hidden rounded-md border @3xl:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {pageRows.length > 0 && (
        <div className="flex flex-col items-center justify-between space-y-2 py-4 sm:flex-row sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden flex-1 text-sm text-muted-foreground md:block">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            {hasSelectedRows && (
              <div className="text-sm text-muted-foreground">
                Total:{" "}
                {formatCurrency(
                  selectedRows.reduce((sum, row) => {
                    const amount = row.original.amount;
                    return sum + (amount || 0);
                  }, 0)
                )}
              </div>
            )}
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
