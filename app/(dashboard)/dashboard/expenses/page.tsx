"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/use-expenses";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

const PAGE_SIZE = 10;
const emptyForm = {
  expense_date: dayjs().format("YYYY-MM-DD"),
  category: "",
  amount: "",
  payment_method: "cash",
  notes: "",
};

const ExpensesPage = () => {
  const { businesses } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { expenses, loading, totalCount, refetch } = useExpenses(
    currentBusinessId,
    page,
    PAGE_SIZE,
    fromDate || null,
    toDate || null,
    categoryFilter,
  );
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, fromDate, toDate, categoryFilter]);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const periodTotal = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const handleSave = () => {
    if (!currentBusinessId || !form.category.trim() || Number(form.amount) <= 0) return;
    const payload = {
      business_id: currentBusinessId,
      expense_date: form.expense_date,
      category: form.category.trim(),
      amount: Number(form.amount),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm">Track daily business expenses.</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="max-w-sm flex-1">
              <Input
                placeholder="Search category..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
            <div className="flex w-full items-center gap-3 lg:w-auto">
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder="From date"
                className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                disableFuture
              />
              <DatePicker
                value={toDate}
                onChange={setToDate}
                placeholder="To date"
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
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">Visible total</p>
            <p className="text-xl font-semibold">{periodTotal.toLocaleString()}</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-6" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-muted-foreground rounded-md border p-4 text-sm">
              No expenses found for this filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
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
                    <TableCell className="text-right">{Number(expense.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate md:table-cell">
                      {expense.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => {
                            setEditingId(expense.id);
                            setForm({
                              expense_date: expense.expense_date,
                              category: expense.category,
                              amount: String(expense.amount),
                              payment_method: expense.payment_method,
                              notes: expense.notes ?? "",
                            });
                            setDialogOpen(true);
                          }}
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
            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-muted-foreground text-sm">
                Showing {from}-{to} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, lastPage))}
                  disabled={page >= lastPage}
                >
                  Next
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
            <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>Record a business expense for accounting and profit tracking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={form.expense_date}
                onChange={(value) => setForm((prev) => ({ ...prev, expense_date: value }))}
                placeholder="Expense date"
                disableFuture
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Transport, Rent, Utilities"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value.replace(/[^\d.]/g, "") }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Input
                value={form.payment_method}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                placeholder="cash / bank / mobile money"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={createExpense.isPending || updateExpense.isPending}
              disabled={!form.category.trim() || Number(form.amount) <= 0}
            >
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
