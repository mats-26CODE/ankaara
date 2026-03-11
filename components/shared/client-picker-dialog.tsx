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

const PAGE_SIZE = 20;

type ClientPickerDialogProps = {
  businessId: string | null;
  value: string;
  onChange: (clientId: string) => void;
  clients: Client[];
  refetchClients: () => void;
};

const ClientPickerDialog = ({
  businessId,
  value,
  onChange,
  clients,
  refetchClients,
}: ClientPickerDialogProps) => {
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

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [clients, search]);

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
      organization_id: businessId,
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

  return (
    <>
      {/* Trigger row: picker button + add client button */}
      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="basis-4/6 justify-start font-normal"
        >
          <User className="mr-2 size-4 shrink-0 text-muted-foreground" />
          {selectedClient ? (
            <span className="truncate">{selectedClient.name}</span>
          ) : (
            <span className="text-muted-foreground">Select a client</span>
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
          title="Add new client"
          className="basis-auto"
        >
          <Plus className="size-4" />
          Add new client
        </Button>
      </div>

      {/* Client Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Client</DialogTitle>
            <DialogDescription>
              Search and pick a client for this invoice.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Client list */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0 max-h-[50vh]"
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {search ? "No clients match your search." : "No clients yet."}
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
                  <Plus className="size-4 mr-1" />
                  Add Client
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
                      className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-muted/50 rounded-md"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        {(client.email || client.phone) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[client.email, client.phone].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
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
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {filtered.length} client{filtered.length !== 1 ? "s" : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetAddForm();
                setAddOpen(true);
              }}
            >
              <Plus className="size-4 mr-1" />
              New Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>
              Create a new client for your business.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-client-name">Name *</Label>
              <Input
                id="new-client-name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Client name"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-client-email">Email</Label>
              <Input
                id="new-client-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-client-phone">Phone</Label>
              <Input
                id="new-client-phone"
                type="tel"
                value={addForm.phone}
                onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="07XXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-client-address">Address</Label>
              <Input
                id="new-client-address"
                value={addForm.address}
                onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Client address"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createClient.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={!addForm.name.trim()}
              isLoading={createClient.isPending}
            >
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ClientPickerDialog };
