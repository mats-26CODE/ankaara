"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ToastAlert } from "@/config/toast";
import { useUser } from "@/hooks/use-user";
import { STAFF_SUSPENDED_MESSAGE, staffUserCanAuthenticate } from "@/lib/staff-auth-session";
import { createClient } from "@/lib/supabase/client";

/** Signs out staff whose membership was suspended/removed while they had a session. */
export const useStaffSessionGuard = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      try {
        const allowed = await staffUserCanAuthenticate(supabase, user.id);
        if (cancelled || allowed) return;

        await supabase.auth.signOut();
        ToastAlert.error(STAFF_SUSPENDED_MESSAGE);
        router.replace("/login");
      } catch {
        // Ignore transient RPC errors; next navigation will retry.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, router]);
};
