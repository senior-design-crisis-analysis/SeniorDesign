"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type LocationCount = {
  location: string;
  count: number;
};

type Props = {
  locationData: LocationCount[];
};

const LocationTable = ({ locationData }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Distribution</CardTitle>
        <CardDescription className="py-0">
          Breakdown of the most commonly mentioned locations
        </CardDescription>
      </CardHeader>
      <CardContent className="-my-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-left">#</TableHead>
              <TableHead className="text-left">Location</TableHead>
              <TableHead className="text-right">Posts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locationData.length > 0 ? (
              locationData.map((item, index) => (
                <TableRow key={item.location}>
                  <TableCell className="text-left font-bold">
                    {index + 1}
                  </TableCell>
                  <TableCell className="capitalize text-left">
                    {item.location.length > 30
                      ? item.location.slice(0, 30) + "…"
                      : item.location}
                  </TableCell>
                  <TableCell className="text-left">{item.count}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-left text-slate-500 py-4"
                >
                  No location data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LocationTable;
