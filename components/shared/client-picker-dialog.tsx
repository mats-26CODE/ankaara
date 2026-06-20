"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  useClients,
  useCreateClient,
  type Client,
  type CreateClientPayload,
} from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Search, Plus, Check, User } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const PAGE_SIZE = 20;

type ClientPickerDialogProps = {
  businessId: string | null;
  value: string;
  onChange: (clientId: string) => void;
  clients: Client[];
  refetchClients: () => void;
  contextLabel?: string;
  includeWalkIn?: boolean;
};

const ClientPickerDialog = ({
  businessId,
  value,
  onChange,
  clients,
  refetchClients,
  contextLabel = "invoice",
  includeWalkIn = false,
}: ClientPickerDialogProps) => {
  const { t } = useTranslation();
  const createClient = useCreateClient();
  const selectedClient = clients.find((c) => c.id === value);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const selectableClients = useMemo(
    () => (includeWalkIn ? clients : clients.filter((client) => !client.is_walk_in)),
    [clients, includeWalkIn],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return selectableClients;
    const q = search.toLowerCase();
    return selectableClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [selectableClients, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const handleSelect = (clientId: string) => {
    onChange(clientId);
    setPickerOpen(false);
    setSearch("");
  };

  const resetAddForm = () => {
    setAddForm({ name: "", email: "", phone: "", address: "" });
  };

  const handleAddClient = () => {
    if (!addForm.name.trim() || !businessId) return;
    const payload: CreateClientPayload = {
      business_id: businessId,
      name: addForm.name.trim(),
      email: addForm.email.trim() || undefined,
      phone: addForm.phone.trim() || undefined,
      address: addForm.address.trim() || undefined,
    };
    createClient.mutate(payload, {
      onSuccess: (newClient) => {
        refetchClients();
        if (newClient) {
          onChange(newClient.id);
        }
        setAddOpen(false);
        setPickerOpen(false);
        resetAddForm();
        setSearch("");
      },
    });
  };

  const contextKeyMap: Record<string, string> = {
    invoice: "dashboard.pickers.client.contextInvoice",
    quotation: "dashboard.pickers.client.contextQuotation",
    sale: "dashboard.pickers.client.contextSale",
    loan: "dashboard.pickers.client.contextLoan",
  };
  const contextText = t(contextKeyMap[contextLabel] ?? contextKeyMap.invoice);
  const clientCountLabel =
    filtered.length === 1
      ? t("dashboard.pickers.client.count", { count: filtered.length })
      : t("dashboard.pickers.client.countPlural", { count: filtered.length });

  return (
    <>
      {/* Trigger row: picker button + add client button */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="w-full min-w-0 justify-start font-normal sm:flex-1"
        >
          <User className="text-muted-foreground mr-2 size-4 shrink-0" />
          {selectedClient ? (
            <span className="truncate">{selectedClient.name}</span>
          ) : (
            <span className="text-muted-foreground">{t("dashboard.pickers.client.selectPlaceholder")}</span>
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={() => {
            resetAddForm();
            setAddOpen(true);
          }}
          title={t("dashboard.pickers.client.addNewTitle")}
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus className="size-4" />
          {t("dashboard.pickers.client.addNew")}
        </Button>
      </div>

      {/* Client Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.pickers.client.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.pickers.client.description", { context: contextText })}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.pickers.client.searchPlaceholder")}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Client list */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="-mx-6 max-h-[50vh] min-h-0 flex-1 overflow-y-auto px-6"
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  {search
                    ? t("dashboard.pickers.client.emptySearch")
                    : t("dashboard.pickers.client.emptyNoData")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetAddForm();
                    if (search.trim()) {
                      setAddForm((p) => ({ ...p, name: search.trim() }));
                    }
                    setAddOpen(true);
                  }}
                >
                  <Plus className="mr-1 size-4" />
                  {t("dashboard.common.addClient")}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {visible.map((client) => {
                  const isSelected = client.id === value;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelect(client.id)}
                      className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-md px-1 py-3 text-left transition-colors"
                    >
                      <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium uppercase">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{client.name}</p>
                          {client.is_walk_in && (
                            <span className="text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] uppercase">
                              {t("dashboard.common.walkIn")}
                            </span>
                          )}
                        </div>
                        {(client.email || client.phone) && (
                          <p className="text-muted-foreground truncate text-xs">
                            {[client.email, client.phone].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {isSelected && <Check className="text-primary size-4 shrink-0" />}
                    </button>
                  );
                })}
                {hasMore && (
                  <div className="flex justify-center py-3">
                    <Spinner className="size-4" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer: Add client shortcut */}
          <div className="flex items-center justify-between border-t pt-2">
            <p className="text-muted-foreground text-xs">{clientCountLabel}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetAddForm();
                setAddOpen(true);
              }}
            >
              <Plus className="mr-1 size-4" />
              {t("dashboard.pickers.client.newClient")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.pickers.client.addTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.pickers.client.addDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-client-name">{t("dashboard.common.name")} *</Label>
              <Input
                id="new-client-name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("dashboard.pickers.client.namePlaceholder")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-client-email">{t("dashboard.common.email")}</Label>
              <Input
                id="new-client-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-client-phone">{t("dashboard.common.phone")}</Label>
              <Input
                id="new-client-phone"
                type="tel"
                value={addForm.phone}
                onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="07XXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-client-address">{t("dashboard.common.address")}</Label>
              <Input
                id="new-client-address"
                value={addForm.address}
                onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
                placeholder={t("dashboard.pickers.client.addressPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createClient.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={!addForm.name.trim()}
              isLoading={createClient.isPending}
            >
              {t("dashboard.common.addClient")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ClientPickerDialog };
