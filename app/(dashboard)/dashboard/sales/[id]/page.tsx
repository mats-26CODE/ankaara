"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useSale } from "@/hooks/use-sales";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { segmentParam } from "@/lib/route-params";
import {
  ArrowLeft,
  CircleDollarSign,
  FileText,
  Package,
  TrendingUp,
  UserRound,
} from "lucide-react";

const SaleDetailPage = () => {
  const params = useParams();
  const id = segmentParam(params.id);
  const router = useRouter();
  const { sale, loading, refetch } = useSale(id);
  const { format: formatAmount } = useFormatAmount();

  if (!id) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="default" onClick={() => void refetch()}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/sales">Back to Sales</Link>
          </Button>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Sale summary</CardTitle>
          <CardDescription>Amounts and customer for this sale.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Total</p>
                <CircleDollarSign className="size-4 shrink-0 text-blue-600" />
              </div>
              <p className="mt-2 text-xl font-bold">
                {formatAmount(Number(sale.total), { decimalDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Cost</p>
                <Package className="size-4 shrink-0 text-violet-600" />
              </div>
              <p className="mt-2 text-xl font-bold">
                {formatAmount(Number(sale.total_cost), { decimalDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border bg-green-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Profit</p>
                <TrendingUp className="size-4 shrink-0 text-green-600" />
              </div>
              <p className="mt-2 text-xl font-bold">
                {formatAmount(Number(sale.profit), { decimalDigits: 0 })}
              </p>
            </div>
            <div className="min-w-0 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Client</p>
                <UserRound className="text-muted-foreground size-4 shrink-0" />
              </div>
              <p
                className="mt-2 truncate text-xl font-medium"
                title={sale.client?.name ?? "Walk-in"}
              >
                {sale.client?.name ?? "Walk-in"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
