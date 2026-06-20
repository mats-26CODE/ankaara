"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
import { useLoan, useRecordLoanPayment, useCreateInvoiceFromLoan } from "@/hooks/use-loans";
import { formatAmount as formatCurrencyAmount } from "@/hooks/use-format-amount";
import { findCurrency, useCurrencies } from "@/hooks/use-currencies";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const formatAmountDisplay = (val: string): string => {
  if (val === "" || val === ".") return val;
  const n = Number(val.replace(/,/g, ""));
  return Number.isNaN(n) ? val : n.toLocaleString();
};

const parseAmountInput = (raw: string): string => {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIdx = cleaned.indexOf(".");
  if (dotIdx === -1) return cleaned;
  const int = cleaned.slice(0, dotIdx);
  const dec = cleaned
    .slice(dotIdx + 1)
    .replace(/\D/g, "")
    .slice(0, 2);
  return dec ? `${int}.${dec}` : int || ".";
};

const LoanDetailPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const id = useRouteUuidParam("id");
  const { currencies } = useCurrencies();
  const { loan, items, payments, loading, refetch } = useLoan(id);
  const recordPayment = useRecordLoanPayment();
  const createInvoiceFromLoan = useCreateInvoiceFromLoan();

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const paymentAmount = Number(amount.replace(/,/g, "")) || 0;
  const outstandingBalance = Number(loan?.outstanding_balance) || 0;
  const exceedsOutstanding = paymentAmount > outstandingBalance;

  const submitPayment = () => {
    if (!id || paymentAmount <= 0) return;
    recordPayment.mutate(
      {
        loan_id: id,
        amount: paymentAmount,
        payment_date: paymentDate,
        method: paymentMethod,
        reference: reference.trim() || null,
      },
      {
        onSuccess: () => {
          setAmount("");
          setReference("");
          refetch();
        },
      },
    );
  };

  if (!id || loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-muted-foreground">{t("dashboard.loans.detail.notFound")}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/loans">{t("dashboard.common.backToLoans")}</Link>
        </Button>
      </div>
    );
  }

  const formatLoanAmount = (amount: number) =>
    formatCurrencyAmount(amount, findCurrency(currencies, loan.currency ?? "TZS"), {
      decimalDigits: 0,
    });

  const paymentsReceived = payments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{loan.loan_number}</h1>
            <p className="text-muted-foreground text-sm">
              {loan.client?.name ?? t("dashboard.loans.detail.fallbackClient")} •{" "}
              {dayjs(loan.loan_date).format("MMM D, YYYY")}
            </p>
            {loan.sale_id ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {t("dashboard.loans.detail.autoConvertedHint")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={loan.status === "paid" ? "default" : "secondary"}>
            {t(`dashboard.status.${loan.status}`)}
          </Badge>
          {loan.sale_id ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/sales/${loan.sale_id}`}>{t("dashboard.common.viewSale")}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.loans.detail.statsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("dashboard.loans.detail.loanTotal")}</p>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatLoanAmount(Number(loan.total))}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("dashboard.common.outstanding")}</p>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatLoanAmount(Number(loan.outstanding_balance))}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border p-4",
                paymentsReceived > 0 ? "bg-green-50 text-green-800" : "",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("dashboard.loans.detail.paymentsReceived")}</p>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatLoanAmount(paymentsReceived)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.loans.detail.itemsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.common.description")}</TableHead>
                <TableHead className="text-right">{t("dashboard.common.quantity")}</TableHead>
                <TableHead className="text-right">{t("dashboard.common.unit")}</TableHead>
                <TableHead className="text-right">{t("dashboard.common.discount")}</TableHead>
                <TableHead className="text-right">{t("dashboard.common.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatLoanAmount(Number(item.unit_price))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatLoanAmount(Number(item.discount))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatLoanAmount(Number(item.total))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.loans.detail.paymentTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>{t("dashboard.common.amount")}</Label>
              <Input
                inputMode="decimal"
                value={formatAmountDisplay(amount)}
                onChange={(e) => setAmount(parseAmountInput(e.target.value))}
                placeholder={t("dashboard.loans.detail.amountPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.loans.detail.paymentDate")}</Label>
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                placeholder={t("dashboard.loans.detail.paymentDatePlaceholder")}
                disableFuture
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.common.method")}</Label>
              <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.loans.detail.referenceOptional")}</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">{t("dashboard.loans.detail.impactLabel")}</p>
            <p className="mt-1 text-sm">
              {t("dashboard.loans.detail.remainingBalance")}{" "}
              <span className="font-semibold tabular-nums">
                {formatLoanAmount(Math.max(outstandingBalance - paymentAmount, 0))}
              </span>
            </p>
            {exceedsOutstanding ? (
              <p className="text-destructive mt-2 text-xs">
                {t("dashboard.loans.detail.exceedsBalance")}
                {formatLoanAmount(outstandingBalance)}).
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={submitPayment}
                isLoading={recordPayment.isPending}
                disabled={paymentAmount <= 0 || loan.status === "paid" || exceedsOutstanding}
              >
                {t("dashboard.common.savePayment")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  createInvoiceFromLoan.mutate(
                    { loan_id: loan.id, issue_date: paymentDate },
                    { onSuccess: () => refetch() },
                  )
                }
                isLoading={createInvoiceFromLoan.isPending}
                disabled={!!loan.invoice_id || exceedsOutstanding}
              >
                {loan.invoice_id
                  ? t("dashboard.loans.detail.invoiceCreated")
                  : t("dashboard.loans.detail.invoiceCreate")}
              </Button>
              {loan.invoice_id ? (
                <Button asChild variant="outline">
                  <Link href={`/dashboard/invoices/${loan.invoice_id}`}>
                    {t("dashboard.common.viewInvoice")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.loans.detail.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("dashboard.loans.detail.historyEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.common.date")}</TableHead>
                  <TableHead>{t("dashboard.common.method")}</TableHead>
                  <TableHead>{t("dashboard.common.reference")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.common.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{dayjs(payment.payment_date).format("MMM D, YYYY")}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{payment.reference || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatLoanAmount(Number(payment.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanDetailPage;
