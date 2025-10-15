"use client";
//start imports
import * as React from "react";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import supabase from "@/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Calendar } from "../ui/calendar";
import type { TableSkeet } from "@/components/posts_table/tableskeet_type";
import { columns } from "./columns";
//end imports

export default function TableSkeetTable() {
  const [data, setData] = React.useState<TableSkeet[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [helpOnly, setHelpOnly] = React.useState(false);
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  //fetch data from supabase
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("SZ-extracted_info_output_duplicate")
        .select("*")
        .limit(100);

      if (error) console.error(error);
      else setData(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  //useEffects to toggle filter for help requests only
  React.useEffect(() => {
    table.getColumn("help_req")?.setFilterValue(helpOnly ? true : undefined);
  }, [helpOnly]);

  //create table
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  //search filter for post text
  const postTextFilter =
    (table.getColumn("original_text")?.getFilterValue() as string) ?? "";

  //useEffect to filter posted date range
  React.useEffect(() => {
    const column = table.getColumn("created_at");
    if (dateRange?.from || dateRange?.to) {
      column?.setFilterValue(dateRange);
    } else {
      column?.setFilterValue(undefined);
    }
  }, [dateRange, table]);

  return (
    <div className="bg-slate-50 w-full overflow-x-auto p-6">
      <div
        className="flex"
        style={{ color: "#020617", fontSize: "24px", fontWeight: 500 }}
      >
        Post Table
      </div>
      <div className="flex items-center py-4 gap-2 flex-wrap justify-between">
        <div className="relative w-full max-w-sm">
          <Search //filter by post text
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            size={16}
          />
          <Input
            placeholder="Filter by post text..."
            value={postTextFilter}
            onChange={(event) =>
              table
                .getColumn("original_text")
                ?.setFilterValue(event.target.value)
            }
            className="bg-white pl-10  max-h-[40px] text-[#64748B]"
            style={{ fontSize: "14px", fontWeight: 400 }}
          />
        </div>
        <div
          className="flex gap-2 center" //filter by date range
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date"
                className="bg-white w-[240px] justify-between font-normal h-[40px]"
                style={{ fontSize: "14px", fontWeight: 400 }}
              >
                {dateRange?.from && dateRange?.to
                  ? `${dateRange.from
                      .toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      .replace(",", ".")} - ${dateRange.to
                      .toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      .replace(",", ".")}`
                  : dateRange?.from
                  ? dateRange.from
                      .toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      .replace(",", ".")
                  : "Select date"}
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="bg-white w-auto overflow-hidden p-0"
              align="start"
              style={{ fontSize: "14px", fontWeight: 400 }}
            >
              <Calendar //popdown calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="bg-white rounded-lg border shadow-sm"
                style={{ fontSize: "14px", fontWeight: 400 }}
                captionLayout="dropdown"
                hideNavigation={true}
              />
            </PopoverContent>
          </Popover>

          <Select //filter by severity level
            value={
              (table.getColumn("severity_level")?.getFilterValue() as string) ||
              "all"
            }
            onValueChange={(value) => {
              const column = table.getColumn("severity_level");
              if (value === "all") {
                column?.setFilterValue(undefined);
              } else {
                column?.setFilterValue(value);
              }
            }}
          >
            <SelectTrigger
              className="w-[140px] max-h-[40px] bg-white text-[#020617] font-normal text-sm"
              style={{ color: "#020617", fontWeight: 400, fontSize: "14px" }}
            >
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-md rounded-md">
              <SelectItem
                value="all"
                className="hover:bg-slate-100"
                style={{
                  color: "#64748b",
                  fontWeight: 400,
                  fontSize: "14px",
                }}
              >
                All Severities
              </SelectItem>
              {["low", "medium", "high"].map((level) => (
                <SelectItem
                  key={level}
                  value={level}
                  className="hover:bg-slate-100"
                  style={{
                    color: "#020617",
                    fontWeight: 400,
                    fontSize: "14px",
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select //filter by disaster type
            value={
              (table.getColumn("disaster_type")?.getFilterValue() as string) ||
              "all"
            }
            onValueChange={(value) => {
              const column = table.getColumn("disaster_type");
              if (value === "all") {
                column?.setFilterValue(undefined);
              } else {
                column?.setFilterValue(value);
              }
            }}
          >
            <SelectTrigger
              className="w-[160px] max-h-[40px] bg-white text-[#020617] font-normal text-sm"
              style={{ color: "#020617", fontWeight: 400, fontSize: "14px" }}
            >
              <SelectValue placeholder="Disaster" />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-md rounded-md">
              <SelectItem
                value="all"
                className="hover:bg-slate-100"
                style={{
                  color: "#64748b",
                  fontWeight: 400,
                  fontSize: "14px",
                }}
              >
                All Disasters
              </SelectItem>
              {[
                "flood",
                "fire",
                "earthquake",
                "hurricane",
                "tornado",
                "shooting",
                "auto_accident",
                "storm",
                "severe_storm",
                "other",
              ].map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="hover:bg-slate-100"
                  style={{
                    color: "#020617",
                    fontWeight: 400,
                    fontSize: "14px",
                  }}
                >
                  {type
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 ml-2">
            <Switch //filter by toggling for help requests
              id="help-toggle"
              checked={helpOnly}
              onCheckedChange={setHelpOnly}
              style={{ color: "#64748B" }}
            />
            <Label
              htmlFor="help-toggle"
              className="text-[#64748B]"
              style={{ fontSize: "14px", fontWeight: 400, color: "#020617" }}
            >
              Help Requests Only
            </Label>
          </div>
        </div>
      </div>

      <div
        className="bg-white overflow-hidden rounded-md border"
        style={{ color: "#020617", fontWeight: 300, fontSize: "14px" }}
      >
        {loading ? ( //loading state
          <div
            className="p-4 text-center text-muted-foreground"
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "#64748B",
            }}
          >
            Loading data...
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(
                (
                  headerGroup //display table after loading
                ) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={
                          header.column.id === "original_text"
                            ? "text-left"
                            : "text-center whitespace-nowrap"
                        }
                        style={{
                          width:
                            header.column.id === "select" ? "40px" : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                )
              )}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "original_text"
                            ? "whitespace-normal break-words text-left"
                            : "text-center whitespace-nowrap"
                        }
                        style={{
                          fontSize: "14px",
                          color: "#09090b",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    style={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#09090b",
                    }}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div
          className="text-muted-foreground flex-1 text-sm"
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#64748B",
          }}
        >
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button //pagination buttons
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-[36px]"
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "#64748B",
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-[36px]"
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "#64748B",
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
