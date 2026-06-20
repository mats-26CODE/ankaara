"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";
import dayjs from "dayjs";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type Expense,
} from "@/hooks/use-expenses";
import { useExpenseCategories } from "@/hooks/use-expense-categories";
import { useTranslation } from "@/hooks/use-translation";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

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

const parseAmountValue = (val: string): number => Number(val.replace(/,/g, "")) || 0;

const emptyForm = {
  expense_date: dayjs().format("YYYY-MM-DD"),
  categoryId: "",
  customCategory: "",
  amount: "",
  payment_method: "cash",
  notes: "",
};

const ExpensesPage = () => {
  const { t } = useTranslation();
  const { format: formatAmount } = useFormatAmount();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { expenses, loading, totalCount, refetch } = useExpenses(
    currentBusinessId,
    page,
    PAGE_SIZE,
    fromDate || null,
    toDate || null,
    debouncedSearch,
  );
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const {
    categories,
    selectableCategories,
    otherCategory,
    loading: categoriesLoading,
  } = useExpenseCategories(currentBusinessId);

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === currentBusinessId) ?? businesses[0] ?? null,
    [businesses, currentBusinessId],
  );

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, fromDate, toDate, debouncedSearch]);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const isOtherSelected = selectedCategory?.is_other ?? false;
  const resolvedCategory = isOtherSelected
    ? form.customCategory.trim()
    : (selectedCategory?.name ?? "");

  const openExpenseDialog = (expense?: Expense) => {
    if (expense) {
      const byId = expense.category_id
        ? categories.find((category) => category.id === expense.category_id)
        : null;
      const matched =
        byId ??
        selectableCategories.find(
          (category) => category.name.toLowerCase() === expense.category.toLowerCase(),
        );
      const useOther = matched?.is_other || !matched;
      setEditingId(expense.id);
      setForm({
        expense_date: expense.expense_date,
        categoryId: matched?.id ?? otherCategory?.id ?? "",
        customCategory: useOther ? expense.category : "",
        amount: String(expense.amount),
        payment_method: expense.payment_method,
        notes: expense.notes ?? "",
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const expenseAmount = parseAmountValue(form.amount);

  const handleSave = () => {
    if (!currentBusinessId || !resolvedCategory || expenseAmount <= 0) return;
    const payload = {
      business_id: currentBusinessId,
      expense_date: form.expense_date,
      category: resolvedCategory,
      category_id: isOtherSelected ? (otherCategory?.id ?? null) : (selectedCategory?.id ?? null),
      amount: expenseAmount,
      payment_method: form.payment_method.trim() || "cash",
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateExpense.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingId(null);
            setForm(emptyForm);
            refetch();
          },
        },
      );
      return;
    }

    createExpense.mutate(payload, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm(emptyForm);
        refetch();
      },
    });
  };

  if (businessesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card className="mx-auto mt-12 max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Building2 className="text-muted-foreground size-12" />
          <div className="space-y-1 text-center">
            <p className="font-medium">{t("dashboard.common.noBusinessTitle")}</p>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.empty.noBusiness.expenses")}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/settings/businesses">{t("dashboard.common.goToBusinesses")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.expenses.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.expenses.subtitlePrefix")}{" "}
            <span className="font-medium">
              {activeBusiness?.name ?? t("dashboard.common.yourBusiness")}
            </span>
            .
          </p>
        </div>
        <Button size="sm" onClick={() => openExpenseDialog()}>
          <Plus className="mr-1 size-4" />
          {t("dashboard.common.addExpense")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("dashboard.expenses.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="flex w-full items-center gap-3 lg:w-auto">
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder={t("dashboard.common.fromDate")}
                className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                disableFuture
              />
              <DatePicker
                value={toDate}
                onChange={setToDate}
                placeholder={t("dashboard.common.toDate")}
                className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                disableFuture
              />
              {(fromDate || toDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="shrink-0"
                >
                  <X className="size-4 text-red-400" />
                  {t("dashboard.common.clear")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Wallet className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {debouncedSearch.trim() || fromDate || toDate
                  ? t("dashboard.expenses.emptyNoMatch")
                  : t("dashboard.expenses.emptyNoData")}
              </p>
              {!debouncedSearch.trim() && !fromDate && !toDate && (
                <Button size="sm" variant="outline" onClick={() => openExpenseDialog()}>
                  <Plus className="mr-1 size-4" />
                  {t("dashboard.common.addExpense")}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.common.date")}</TableHead>
                  <TableHead>{t("dashboard.expenses.table.category")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("dashboard.expenses.table.payment")}
                  </TableHead>
                  <TableHead className="text-right">{t("dashboard.common.amount")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dashboard.common.notes")}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{dayjs(expense.expense_date).format("MMM D, YYYY")}</TableCell>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell className="hidden capitalize md:table-cell">
                      {expense.payment_method}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(Number(expense.amount), { decimalDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate md:table-cell">
                      {expense.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => openExpenseDialog(expense)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-red-600"
                          onClick={() =>
                            deleteExpense.mutate(expense.id, {
                              onSuccess: () => refetch(),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {total > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {t("dashboard.common.showingRange", { from, to, total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  {t("dashboard.common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage || loading}
                >
                  {t("dashboard.common.next")}
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("dashboard.expenses.dialog.editTitle") : t("dashboard.expenses.dialog.addTitle")}
            </DialogTitle>
            <DialogDescription>{t("dashboard.expenses.dialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dashboard.common.date")}</Label>
              <DatePicker
                value={form.expense_date}
                onChange={(value) => setForm((prev) => ({ ...prev, expense_date: value }))}
                placeholder={t("dashboard.expenses.form.datePlaceholder")}
                disableFuture
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.expenses.table.category")}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: value,
                    customCategory: categories.find((c) => c.id === value)?.is_other
                      ? prev.customCategory
                      : "",
                  }))
                }
                disabled={categoriesLoading || categories.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dashboard.expenses.form.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {selectableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {otherCategory ? (
                    <SelectItem value={otherCategory.id}>{otherCategory.name}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              {isOtherSelected ? (
                <Input
                  value={form.customCategory}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customCategory: e.target.value }))
                  }
                  placeholder={t("dashboard.expenses.form.customCategoryPlaceholder")}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.common.amount")}</Label>
              <Input
                inputMode="decimal"
                value={formatAmountDisplay(form.amount)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: parseAmountInput(e.target.value) }))
                }
                placeholder={t("dashboard.expenses.form.amountPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.expenses.form.paymentMethod")}</Label>
              <Input
                value={form.payment_method}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                placeholder={t("dashboard.expenses.form.paymentMethodPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.expenses.form.notesOptional")}</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t("dashboard.expenses.form.notesPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              isLoading={createExpense.isPending || updateExpense.isPending}
              disabled={
                !form.categoryId ||
                !resolvedCategory ||
                expenseAmount <= 0 ||
                categoriesLoading
              }
            >
              {t("dashboard.common.saveExpense")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
