import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, AlertCircle } from "lucide-react";
import type { TableSkeet } from "./tableskeet_type";

export const columns: ColumnDef<TableSkeet>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="h-4 w-4 border-slate-300 text-slate-700 data-[state=checked]:bg-slate-700 data-[state=checked]:text-white"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="h-4 w-4 border-slate-300 text-slate-700 data-[state=checked]:bg-slate-700 data-[state=checked]:text-white"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "original_text",
    header: () => (
      <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
        Post Text
      </span>
    ),
    cell: ({ row }) => (
      <div className="whitespace-normal break-words">
        {row.getValue("original_text")}
      </div>
    ),
  },
  {
    accessorKey: "disaster_type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
          Disaster
        </span>

        <ArrowUpDown className="ml-0 h-4 w-4 text-slate-500" />
      </Button>
    ),
    cell: ({ row }) => {
      const disaster = row.getValue("disaster_type") as string;

      const mapDisaster: Record<string, string> = {
        flood: "Flood",
        fire: "Fire",
        earthquake: "Earthquake",
        hurricane: "Hurricane",
        tornado: "Tornado",
        shooting: "Shooting",
        auto_accident: "Auto Accident",
        severe_storm: "Severe Storm",
        storm: "Storm",
        other: "Other",
      };

      return (
        <Badge className={"rounded-full px-2 py-1 border-2"}>
          {mapDisaster[disaster] || disaster}
        </Badge>
      );
    },
  },
  {
    accessorKey: "severity_level",
    header: () => (
      <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
        Severity
      </span>
    ),
    cell: ({ row }) => {
      const severity = row.getValue("severity_level") as string;

      return (
        <Badge
          className={`rounded-full px-2 py-1 text-white outline-none ${
            severity === "disaster" ? "text-black" : "border-weight-0"
          }`}
          style={
            severity === "high"
              ? { backgroundColor: "#B91C1C" }
              : severity === "medium"
              ? { backgroundColor: "#CA8A04" }
              : severity === "low"
              ? { backgroundColor: "#67A9CF" }
              : undefined
          }
        >
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "location_mentioned",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
          Location
        </span>

        <ArrowUpDown className="ml-0 h-4 w-4 text-slate-500" />
      </Button>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
          Timestamp
        </span>
        <ArrowUpDown className="ml-0 h-4 w-4 text-slate-500" />
      </Button>
    ),

    cell: ({ row }) => {
      const timestamp = row.getValue("created_at") as string;
      const date = new Date(timestamp);
      const readable = date.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        dateStyle: "medium",
        timeStyle: "short",
      });

      return (
        <div style={{ whiteSpace: "nowrap" }}>{readable.replace(",", ".")}</div>
      );
    },

    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;

      const { from, to } = filterValue;
      const rowTimestamp = row.getValue(columnId) as string;
      const rowDate = new Date(
        new Date(rowTimestamp).toLocaleString("en-US", {
          timeZone: "America/Chicago",
        })
      );

      if (from && to) {
        const fromDate = new Date(
          new Date(from).toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })
        );
        const toDate = new Date(
          new Date(to).toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })
        );
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return rowDate >= fromDate && rowDate <= toDate;
      } else if (from) {
        const fromDate = new Date(
          new Date(from).toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })
        );
        fromDate.setHours(0, 0, 0, 0);
        return rowDate >= fromDate;
      } else if (to) {
        const toDate = new Date(
          new Date(to).toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })
        );
        toDate.setHours(23, 59, 59, 999);
        return rowDate <= toDate;
      }

      return true;
    },
  },

  {
    accessorKey: "help_req",
    header: () => (
      <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
        Help Requested
      </span>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Badge
          className="rounded-full w-[22px] h-[22px] flex items-center justify-center"
          style={
            row.getValue("help_req")
              ? { backgroundColor: "red" }
              : { backgroundColor: "gray" }
          }
        >
          {row.getValue("help_req") ? (
            <AlertCircle
              color="white"
              fill="red"
              className="w-[22px] h-[22px]"
            />
          ) : (
            <AlertCircle
              color="white"
              fill="gray"
              className="w-[22px] h-[22px]"
            />
          )}
        </Badge>
      </div>
    ),
    /*cell: ({ row }) => <div className="flex justify-center items-center">{row.getValue("help_req") ? <Hand className="w-6 h-6 text-red-700" /> : <Hand className="w-6 h-6 text-slate-400" />}</div>,*/
  },
  {
    accessorKey: "author",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span style={{ color: "#64748B", fontWeight: 400, fontSize: "14px" }}>
          Handle
        </span>
        <ArrowUpDown className="ml-0 h-4 w-4 text-slate-500" />
      </Button>
    ),
  },
];
