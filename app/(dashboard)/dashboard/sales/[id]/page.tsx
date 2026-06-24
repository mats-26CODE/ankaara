"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useState } from "react";
import {
  isSaleItemReturnable,
  saleItemRemainingQuantity,
  useSale,
} from "@/hooks/use-sales";
import { useCanManageSales } from "@/hooks/use-staff-permissions";
import { useTranslation } from "@/hooks/use-translation";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { ReturnSaleItemDialog } from "@/components/sales/return-sale-item-dialog";
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
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
import {
  ArrowLeft,
  CircleDollarSign,
  FileText,
  Package,
  Pencil,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { SaleItem } from "@/hooks/use-sales";

const SaleDetailPage = () => {
  const { t } = useTranslation();
  const id = useRouteUuidParam("id");
  const router = useRouter();
  const { sale, loading, refetch } = useSale(id);
  const { format: formatAmount } = useFormatAmount();
  const canManageSales = useCanManageSales();
  const [returnItem, setReturnItem] = useState<SaleItem | null>(null);

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
        <p className="text-muted-foreground">{t("dashboard.sales.detail.notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/sales">{t("dashboard.common.backToSales")}</Link>
        </Button>
      </div>
    );
  }

  const canEditSale = canManageSales && sale.source === "direct";
  const showReturnColumn = canManageSales;

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
                {sale.source === "invoice"
                  ? t("dashboard.sales.detail.badgeInvoice")
                  : t("dashboard.sales.detail.badgeDirect")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.sales.detail.soldOn")} {dayjs(sale.sale_date).format("MMMM D, YYYY")} ·{" "}
              {t("dashboard.sales.detail.recorded")}{" "}
              {dayjs(sale.recorded_at).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditSale ? (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/sales/${sale.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {t("dashboard.common.edit")}
              </Link>
            </Button>
          ) : null}
          {sale.invoice_id ? (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/invoices/${sale.invoice_id}`}>
                <FileText className="mr-2 size-4" />
                {t("dashboard.common.viewInvoice")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.sales.detail.summaryTitle")}</CardTitle>
          <CardDescription>{t("dashboard.sales.detail.summaryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("dashboard.common.total")}</p>
                <CircleDollarSign className="size-4 shrink-0 text-blue-600" />
              </div>
              <p className="mt-2 text-xl font-bold">
                {formatAmount(Number(sale.total), { decimalDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("dashboard.common.cost")}</p>
                <Package className="size-4 shrink-0 text-violet-600" />
              </div>
              <p className="mt-2 text-xl font-bold">
                {formatAmount(Number(sale.total_cost), { decimalDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border bg-green-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("dashboard.common.profit")}</p>
                <TrendingUp className="size-4 shrink-0 text-green-600" />
              </div>
              <p className="mt-2 text-xl font-bold">
                {formatAmount(Number(sale.profit), { decimalDigits: 0 })}
              </p>
            </div>
            <div className="min-w-0 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("dashboard.common.client")}</p>
                <UserRound className="text-muted-foreground size-4 shrink-0" />
              </div>
              <p
                className="mt-2 truncate text-xl font-medium"
                title={sale.client?.name ?? t("dashboard.common.walkIn")}
              >
                {sale.client?.name ?? t("dashboard.common.walkIn")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.sales.detail.itemsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.sales.detail.item")}</TableHead>
                <TableHead>{t("dashboard.common.type")}</TableHead>
                <TableHead>{t("dashboard.common.quantity")}</TableHead>
                <TableHead>{t("dashboard.common.price")}</TableHead>
                <TableHead>{t("dashboard.common.discount")}</TableHead>
                <TableHead>{t("dashboard.common.total")}</TableHead>
                <TableHead>{t("dashboard.common.profit")}</TableHead>
                {showReturnColumn ? (
                  <TableHead className="text-right">{t("dashboard.sales.detail.actions")}</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sale.items ?? []).map((item) => {
                const discount = Number(item.discount) || 0;
                const returnedQty = Number(item.returned_quantity) || 0;
                const remainingQty = saleItemRemainingQuantity(item);
                const isFullyReturned = returnedQty > 0 && remainingQty <= 0;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <span>{item.description}</span>
                        {returnedQty > 0 ? (
                          <Badge variant={isFullyReturned ? "secondary" : "outline"}>
                            {isFullyReturned
                              ? t("dashboard.sales.detail.fullyReturned")
                              : t("dashboard.sales.detail.returned", {
                                  qty: returnedQty.toLocaleString(),
                                })}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.item_type === "service" ? "secondary" : "default"}>
                        {item.item_type === "service"
                          ? t("dashboard.common.service")
                          : t("dashboard.common.product")}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(item.quantity).toLocaleString()}</TableCell>
                    <TableCell>{Number(item.unit_price).toLocaleString()}</TableCell>
                    <TableCell className={discount > 0 ? "tabular-nums" : "text-muted-foreground"}>
                      {discount > 0 ? discount.toLocaleString() : "0"}
                    </TableCell>
                    <TableCell>{Number(item.total).toLocaleString()}</TableCell>
                    <TableCell>{Number(item.profit).toLocaleString()}</TableCell>
                    {showReturnColumn ? (
                      <TableCell className="text-right">
                        {isSaleItemReturnable(item) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReturnItem(item)}
                          >
                            {t("dashboard.sales.return.action")}
                          </Button>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReturnSaleItemDialog
        open={returnItem !== null}
        onOpenChange={(open) => {
          if (!open) setReturnItem(null);
        }}
        item={returnItem}
        saleId={sale.id}
        onSuccess={() => void refetch()}
      />
    </div>
  );
};

export default SaleDetailPage;
