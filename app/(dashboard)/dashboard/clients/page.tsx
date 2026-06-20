"use client";

import { useState, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  type Client,
} from "@/hooks/use-clients";
import { useBusinesses } from "@/hooks/use-businesses";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: FormState = { name: "", email: "", phone: "", address: "" };

const PAGE_SIZE = 10;

const ClientsPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { clients, loading, refetch, totalCount } = useClients(
    currentBusinessId,
    page,
    PAGE_SIZE,
    { search: debouncedSearch },
  );
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  // Auto-select first business
  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  // Reset to first page when business changes
  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, debouncedSearch]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    if (editingClient) {
      updateClient.mutate(
        {
          id: editingClient.id,
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            refetch();
          },
        },
      );
    } else {
      if (!currentBusinessId) return;
      createClient.mutate(
        {
          business_id: currentBusinessId,
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            refetch();
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deletingClient) return;
    deleteClient.mutate(deletingClient.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingClient(null);
        refetch();
      },
    });
  };

  const isMutating = createClient.isPending || updateClient.isPending || deleteClient.isPending;

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  // No business exists yet
  if (businesses.length === 0) {
    return (
      <Card className="mx-auto mt-12 max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Building2 className="text-muted-foreground size-12" />
          <div className="space-y-1 text-center">
            <p className="font-medium">{t("dashboard.common.noBusinessTitle")}</p>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.empty.noBusiness.clients")}
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
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.clients.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.clients.subtitlePrefix")}{" "}
            <span className="font-medium">
              {businesses.find((b) => b.id === currentBusinessId)?.name ||
                t("dashboard.common.yourBusiness")}
            </span>
            .
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          {t("dashboard.common.addClient")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.clients.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {debouncedSearch.trim()
                  ? t("dashboard.clients.emptyNoMatch")
                  : t("dashboard.clients.emptyNoData")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.common.name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("dashboard.common.email")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dashboard.common.phone")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("dashboard.common.address")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        {client.is_walk_in && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {t("dashboard.common.walkIn")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate lg:table-cell">
                      {client.address || "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {client.is_walk_in ? (
                            <DropdownMenuItem disabled>
                              {t("dashboard.common.systemClient")}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => openEdit(client)}>
                                <Pencil className="mr-2 size-4" />
                                {t("dashboard.common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDelete(client)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                {t("dashboard.common.delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? t("dashboard.clients.dialog.editTitle") : t("dashboard.common.addClient")}
            </DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              {editingClient
                ? t("dashboard.clients.dialog.editDescription")
                : t("dashboard.clients.dialog.addDescription")}
              {currentBusinessId && (
                <span className="flex items-center gap-2">
                  {t("dashboard.common.businessLabel")}{" "}
                  <Badge variant="secondary" className="font-normal">
                    {businesses.find((b) => b.id === currentBusinessId)?.name ?? "—"}
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">{t("dashboard.common.name")} *</Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("dashboard.clients.form.namePlaceholder")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-email">{t("dashboard.common.email")}</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder={t("dashboard.clients.form.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">{t("dashboard.common.phone")}</Label>
                <Input
                  id="client-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={t("dashboard.clients.form.phonePlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-address">{t("dashboard.common.address")}</Label>
              <Input
                id="client-address"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder={t("dashboard.clients.form.addressPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isMutating}>
              {t("dashboard.common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} isLoading={isMutating}>
              {editingClient ? t("dashboard.common.save") : t("dashboard.common.addClient")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.clients.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.clients.delete.confirmPrefix")}{" "}
              <span className="font-medium">{deletingClient?.name}</span>
              {t("dashboard.clients.delete.confirmSuffix")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteClient.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleteClient.isPending}>
              {t("dashboard.common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
