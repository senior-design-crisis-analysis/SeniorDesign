"use client";

import {
  Table,
  TableBody,
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

type Props = {
  locationData?: { location: string; count: number }[];
};

export default function LocationCount({ locationData }: Props) {
  // Force locationData to be an array, handling undefined, null, or non-array values
  const safeLocationData = Array.isArray(locationData) ? locationData : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Distribution</CardTitle>
        <CardDescription>
          Breakdown of the most commonly mentioned locations
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-left">#</TableHead>
              <TableHead className="text-left">Location</TableHead>
              <TableHead className="text-right w-[80px]">Posts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeLocationData.length > 0 ? (
              safeLocationData.map((item, index) => (
                <TableRow key={item.location ?? index}>
                  <TableCell className="text-left font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="capitalize text-left">
                    {item.location && item.location.length > 30
                      ? item.location.slice(0, 30) + "…"
                      : item.location}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.count}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-8"
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
}
