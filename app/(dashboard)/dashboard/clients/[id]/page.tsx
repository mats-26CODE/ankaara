"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
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
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type ClientLoanRow = {
  id: string;
  loan_number: string;
  loan_date: string;
  status: string;
  total: number;
  outstanding_balance: number;
};

const ClientDetailPage = () => {
  const router = useRouter();
  const { format: formatAmount } = useFormatAmount();
  const id = useRouteUuidParam("id");
  const [client, setClient] = useState<Client | null>(null);
  const [loans, setLoans] = useState<ClientLoanRow[]>([]);
  const [loanPage, setLoanPage] = useState(1);
  const [loanTotalCount, setLoanTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const LOAN_PAGE_SIZE = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: clientData } = await supabase.from("clients").select("*").eq("id", id).single();
      const from = (loanPage - 1) * LOAN_PAGE_SIZE;
      const to = from + LOAN_PAGE_SIZE - 1;
      const { data: loanData, count: loanCount } = await supabase
        .from("loans")
        .select("id, loan_number, loan_date, status, total, outstanding_balance", {
          count: "exact",
        })
        .eq("client_id", id)
        .order("loan_date", { ascending: false })
        .range(from, to);
      setClient((clientData as Client) ?? null);
      setLoans((loanData as ClientLoanRow[]) ?? []);
      setLoanTotalCount(loanCount ?? null);
      setLoading(false);
    };
    fetchData();
  }, [id, loanPage]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/clients">Back to clients</Link>
        </Button>
      </div>
    );
  }

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + (Number(loan.outstanding_balance) || 0),
    0,
  );
  const totalLoans = loanTotalCount ?? 0;
  const loanLastPage = Math.max(1, Math.ceil(totalLoans / LOAN_PAGE_SIZE));
  const loanFrom = totalLoans === 0 ? 0 : (loanPage - 1) * LOAN_PAGE_SIZE + 1;
  const loanTo = Math.min(loanPage * LOAN_PAGE_SIZE, totalLoans);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar name={client.name} size="xl" className="border-border border-2" />
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-xl wrap-break-word sm:text-2xl">{client.name}</CardTitle>
                <div className="text-muted-foreground flex items-center gap-x-2 gap-y-1 text-sm">
                  {client.email ? <span>{client.email}</span> : null}
                  {client.email && (client.phone || client.created_at) ? <span>•</span> : null}
                  {client.phone ? <span>{client.phone}</span> : null}
                  {client.phone ? <span>•</span> : null}
                  <span>Joined {dayjs(client.created_at).format("MMM D, YYYY")}</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 lg:text-right">
              <p className="text-muted-foreground text-sm">Outstanding loans</p>
              <p className="text-xl font-bold tabular-nums">
                {formatAmount(totalOutstanding, { decimalDigits: 0 })}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loans.length === 0 ? (
            <p className="text-muted-foreground text-sm">No loans for this client.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                  >
                    <TableCell>
                      {loan.loan_number}
                    </TableCell>
                    <TableCell>{dayjs(loan.loan_date).format("MMM D, YYYY")}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "paid" ? "default" : "secondary"}>
                        {loan.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(Number(loan.total), { decimalDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(Number(loan.outstanding_balance), { decimalDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalLoans > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {loanFrom}-{loanTo} of {totalLoans}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoanPage((prev) => Math.max(prev - 1, 1))}
                  disabled={loanPage <= 1}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoanPage((prev) => Math.min(prev + 1, loanLastPage))}
                  disabled={loanPage >= loanLastPage}
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

export default ClientDetailPage;
