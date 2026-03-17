"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { acceptQuotation } from "@/app/actions/accept-quotation";
import { ToastAlert } from "@/config/toast";

type Props = {
  quotationId: string;
  validUntil: string | null;
};

export const AcceptQuotationButton = ({ quotationId, validUntil }: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isExpired = validUntil ? new Date(validUntil) < new Date() : false;

  const handleAccept = async () => {
    if (isExpired) {
      ToastAlert.error("This quotation has expired and can no longer be accepted.");
      return;
    }
    setLoading(true);
    try {
      const result = await acceptQuotation(quotationId);
      if (result.success) {
        ToastAlert.success("Quotation accepted. Thank you!");
        router.refresh();
      } else {
        ToastAlert.error(result.error ?? "Could not accept quotation. It may have expired or already been accepted.");
      }
    } catch {
      ToastAlert.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleAccept}
      disabled={loading || isExpired}
      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
    >
      <CheckCircle2 className="size-5" />
      {loading ? "Accepting..." : isExpired ? "Expired" : "Accept Quotation"}
    </Button>
  );
};
