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
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
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
import "./../../App.css";
import { Info } from "lucide-react";
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
        .from("be_extracted_info_output")
        .select("*")
        .limit(10000);

      if (error) console.error(error);
      else setData(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  //useEffects to toggle filter for help requests only
  React.useEffect(() => {
    table
      .getColumn("help_request")
      ?.setFilterValue(helpOnly ? true : undefined);
  }, [helpOnly]);

  //handle tooltip to open link in new tab on click
  const handleTooltipClick = () => {
    window.open("/info", "_blank");
  };

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
    const column = table.getColumn("indexed_at");
    if (dateRange?.from || dateRange?.to) {
      column?.setFilterValue(dateRange);
    } else {
      column?.setFilterValue(undefined);
    }
  }, [dateRange, table]);

  return (
    <div className="bg-slate-50 w-full overflow-x-auto py-6 font-inter font-normal text-sm text-[#020617]">
      {/* Header */}

      <div
        className="flex text-xl font-medium px-2 gap-1 items-center"
        style={{ color: "#020617", fontSize: "28px", fontWeight: 600 }}
      >
        All Activity
        <button
          title="tooltip"
          onClick={handleTooltipClick}
          className="inline-flex items-center justify-center rounded-full bg-black h-[22px] w-[22px]"
        >
          <Info size={22} strokeWidth={2} color="#ffffff" />
        </button>
      </div>
      {/* Filters */}
      <div className="flex items-center py-2 gap-2 flex-wrap justify-between">
        {/* Search Input */}
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
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
            className="bg-white pl-10 h-10 text-slate-700"
          />
        </div>
        {/* Date Range */}
        <div className="flex gap-2 items-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-white w-[320px] justify-between h-10 font-normal"
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
                  : "Select date"}
                <ChevronDownIcon className="h-4 w-4 text-slate-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="bg-white w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="bg-white rounded-lg border shadow-sm"
                captionLayout="dropdown"
                hideNavigation
              />
            </PopoverContent>
          </Popover>
          {/* Severities */}
          <Select
            value={
              (table.getColumn("severity_level")?.getFilterValue() as string) ||
              "all"
            }
            onValueChange={(value) => {
              const column = table.getColumn("severity_level");
              column?.setFilterValue(value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[180px] h-10 bg-white">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-md rounded-md">
              <SelectItem value="all" className="hover:bg-slate-100">
                All Severities
              </SelectItem>
              {["low", "medium", "high"].map((level) => (
                <SelectItem
                  key={level}
                  value={level}
                  className="hover:bg-slate-100"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Disasters */}
          <Select
            value={
              (table.getColumn("disaster_type")?.getFilterValue() as string) ||
              "all"
            }
            onValueChange={(value) => {
              const column = table.getColumn("disaster_type");
              column?.setFilterValue(value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[160px] h-10 bg-white">
              <SelectValue placeholder="Disaster" />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-md rounded-md">
              <SelectItem value="all" className="hover:bg-slate-100">
                All Disasters
              </SelectItem>
              {[
                "fire",
                "flood",
                "earthquake",
                "extreme_heat",
                "hurricane",
                "tornado",
                "tropical_storm",
                "shooting",
                "auto_accident",
                "severe_storm",
                "other",
              ].map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="hover:bg-slate-100"
                >
                  {type
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 ml-2">
            <Switch
              id="help-toggle"
              checked={helpOnly}
              onCheckedChange={setHelpOnly}
            />
            <Label htmlFor="help-toggle" className="text-slate-700">
              Help Requests Only
            </Label>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white overflow-hidden rounded-md border text-slate-800">
        {loading ? (
          <div className="p-4 text-center text-slate-500">Loading data...</div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`${
                        header.column.id === "original_text"
                          ? "text-left"
                          : "text-center whitespace-nowrap"
                      }`}
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
              ))}
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
                        className={`${
                          cell.column.id === "original_text"
                            ? "text-left whitespace-normal break-words"
                            : "text-center whitespace-nowrap"
                        }`}
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
                    className="h-24 text-center text-slate-700"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      {/* Footer */}
      <div className="flex justify-between space-x-2 py-4">
        <div className="text-slate-500">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2 justify-end">
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
