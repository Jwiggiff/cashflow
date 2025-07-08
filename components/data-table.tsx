"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
  Row,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { capitalize } from "@/lib/utils";
import { TransactionType } from "@prisma/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  accounts: { id: number; name: string }[];
  categories: {
    id: number;
    name: string;
    icon?: string | null;
  }[];
  onDeleteSelected?: (selectedRows: TData[]) => void;
  onConvertToTransfer?: (selectedRows: TData[]) => void;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  accounts,
  categories,
  onDeleteSelected,
  onConvertToTransfer,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      id: false,
      select: false,
      date: false,
      source: false,
      account: false,
      type: false,
      category: false,
      createdAt: false,
      updatedAt: false,
      actions: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});

  // Update column visibility when mobile state changes
  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        id: false,
        select: false,
        date: false,
        source: false,
        account: false,
        type: false,
        category: false,
        createdAt: false,
        updatedAt: false,
        actions: false,
      });
    } else {
      setColumnVisibility({
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
    }
  }, [isMobile]);

  // Add selection column
  const selectionColumn: ColumnDef<TData, TValue> = {
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
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const types = [...Object.values(TransactionType), "TRANSFER"];

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  const handleDeleteSelected = () => {
    if (onDeleteSelected && hasSelectedRows) {
      const selectedData = selectedRows.map((row) => row.original);
      onDeleteSelected(selectedData);
      // Clear selection after deletion
      table.toggleAllPageRowsSelected(false);
    }
  };

  // Prepare table data with date grouping for mobile
  const tableData = React.useMemo(() => {
    if (!isMobile) {
      // For desktop, just return the table rows
      return table.getRowModel().rows.map(row => ({ type: 'row' as const, row }));
    }

    // For mobile, group by date and add headers
    type RowData = 
      | { type: 'header'; date: string }
      | { type: 'row'; row: Row<TData> };
    
    const groups: RowData[] = [];
    const dateGroups: { [key: string]: Row<TData>[] } = {};

    // Group filtered table rows by date (use filtered rows so filtering works)
    table.getRowModel().rows.forEach((row) => {
      const date = (row.original as { date?: Date }).date;
      if (date) {
        const dateKey = new Date(date).toDateString();
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(row);
      }
    });

    // Sort dates and create grouped structure
    const sortedDates = Object.keys(dateGroups).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach((dateKey) => {
      groups.push({ type: 'header', date: dateKey });
      dateGroups[dateKey].forEach((row) => {
        groups.push({ type: 'row', row });
      });
    });

    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, table, table.getRowModel().rows]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2 flex-wrap">
        <Input
          placeholder="Filter descriptions..."
          value={
            (table.getColumn("description")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
          }
          className={isMobile ? "flex-1" : "max-w-sm"}
        />
        {!isMobile && (
          <>
            <Select
              value={
                (table.getColumn("account")?.getFilterValue() as string) ?? "all"
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
                (table.getColumn("category")?.getFilterValue() as string) ?? "all"
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
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="w-4">
                        {category.icon && (
                          <DynamicIcon
                            name={category.icon as keyof typeof dynamicIconImports}
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
              value={(table.getColumn("type")?.getFilterValue() as string) ?? "all"}
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
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
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
        )}
      </div>
      <div className="rounded-md border">
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
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tableData.length ? (
              tableData.map((rowData) => {
                // Handle mobile date headers
                if (rowData.type === 'header') {
                  return (
                    <TableRow key={`header-${rowData.date}`} className="bg-muted/50">
                      <TableCell colSpan={table.getAllColumns().length} className="font-semibold text-foreground">
                        {rowData.date && new Date(rowData.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                    </TableRow>
                  );
                }
                
                // Handle all data rows (both mobile and desktop)
                if (rowData.type === 'row') {
                  const row = rowData.row;
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer md:cursor-default"
                      onClick={isMobile && onRowClick ? () => onRowClick(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                }
                
                return null;
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
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
  );
}
