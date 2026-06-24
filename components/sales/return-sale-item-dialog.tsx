"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReturnSaleItem, type SaleItem, saleItemRemainingQuantity } from "@/hooks/use-sales";
import { useTranslation } from "@/hooks/use-translation";

type ReturnSaleItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SaleItem | null;
  saleId: string;
  onSuccess?: () => void;
};

export const ReturnSaleItemDialog = ({
  open,
  onOpenChange,
  item,
  saleId,
  onSuccess,
}: ReturnSaleItemDialogProps) => {
  const { t } = useTranslation();
  const returnSaleItem = useReturnSaleItem(saleId);
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const remaining = item ? saleItemRemainingQuantity(item) : 0;
  const parsedQty = Number(quantity);
  const quantityInvalid = !Number.isFinite(parsedQty) || parsedQty <= 0 || parsedQty > remaining;
  const itemName = item?.description?.trim() || item?.product?.name || t("dashboard.sales.detail.item");

  useEffect(() => {
    if (!open || !item) return;
    setQuantity(String(Math.min(1, remaining) || 1));
    setNotes("");
    setConfirmOpen(false);
  }, [item, open, remaining]);

  const handleContinue = () => {
    if (quantityInvalid || !item) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!item || quantityInvalid) return;

    returnSaleItem.mutate(
      {
        sale_item_id: item.id,
        quantity: parsedQty,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open && !confirmOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.sales.return.title")}</DialogTitle>
            <DialogDescription>{t("dashboard.sales.return.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm font-medium">{itemName}</p>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.sales.return.remaining", { qty: remaining.toLocaleString() })}
            </p>

            <div className="space-y-2">
              <Label htmlFor="return-qty">{t("dashboard.sales.return.quantityLabel")}</Label>
              <Input
                id="return-qty"
                type="number"
                min={1}
                max={remaining}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-notes">{t("dashboard.sales.return.notesLabel")}</Label>
              <Textarea
                id="return-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("dashboard.sales.return.notesPlaceholder")}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("dashboard.common.cancel")}
            </Button>
            <Button onClick={handleContinue} disabled={quantityInvalid}>
              {t("dashboard.common.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.sales.return.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.sales.return.confirmDescription", {
                qty: parsedQty.toLocaleString(),
                name: itemName,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={returnSaleItem.isPending}>
              {t("dashboard.sales.return.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
