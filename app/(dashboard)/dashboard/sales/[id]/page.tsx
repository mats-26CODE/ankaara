"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useSale } from "@/hooks/use-sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileText } from "lucide-react";

const SaleDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { sale, loading } = useSale(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Sale not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/sales">Back to Sales</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{sale.sale_number}</h1>
              <Badge variant={sale.source === "invoice" ? "secondary" : "default"}>
                {sale.source === "invoice" ? "Invoice sale" : "Direct sale"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Sold on {dayjs(sale.sale_date).format("MMMM D, YYYY")} · Recorded{" "}
              {dayjs(sale.recorded_at).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>
        </div>
        {sale.invoice_id && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/invoices/${sale.invoice_id}`}>
              <FileText className="mr-2 size-4" />
              View Invoice
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Number(sale.total).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Number(sale.total_cost).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Number(sale.profit).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold">{sale.client?.name ?? "Walk-in"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sale.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>
                    <Badge variant={item.item_type === "service" ? "secondary" : "default"}>
                      {item.item_type === "service" ? "Service" : "Product"}
                    </Badge>
                  </TableCell>
                  <TableCell>{Number(item.quantity).toLocaleString()}</TableCell>
                  <TableCell>{Number(item.unit_price).toLocaleString()}</TableCell>
                  <TableCell>{Number(item.total).toLocaleString()}</TableCell>
                  <TableCell>{Number(item.profit).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleDetailPage;
