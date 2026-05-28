"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useLoans } from "@/hooks/use-loans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";

const PAGE_SIZE = 10;

const LoansPage = () => {
  const router = useRouter();
  const { businesses } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const { loans, loading, totalCount } = useLoans(currentBusinessId, page, PAGE_SIZE);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground text-sm">Manage client loans and repayments.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/loans/create">
            <Plus className="mr-1 size-4" />
            New Loan
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader />
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                      No loans recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => (
                    <TableRow
                      key={loan.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                    >
                      <TableCell className="font-medium">{loan.loan_number}</TableCell>
                      <TableCell>{dayjs(loan.loan_date).format("MMM D, YYYY")}</TableCell>
                      <TableCell>{loan.client?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={loan.status === "paid" ? "default" : "secondary"}>
                          {loan.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{Number(loan.total).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {Number(loan.outstanding_balance).toLocaleString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" asChild>
                          <Link href={`/dashboard/loans/${loan.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <p className="text-muted-foreground text-sm">
                Showing {from}-{to} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
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
    </div>
  );
};

export default LoansPage;
