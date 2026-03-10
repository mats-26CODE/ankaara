"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * App-facing profile shape. Normalized from DB row (phone_number → phone, image_url → avatar_url).
 */
export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: "business" | "individual" | null;
  preferred_currency: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string | null;
};

/** Raw row from public.profiles (DB schema) */
type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  phone_number?: string | null;
  avatar_url: string | null;
  image_url?: unknown;
  account_type: "business" | "individual" | null;
  preferred_currency?: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
  notification_token?: string | null;
  auth_type?: unknown;
};

const normalizeAvatarUrl = (avatar_url: string | null, image_url: unknown): string | null => {
  if (avatar_url) return avatar_url;
  if (image_url == null) return null;
  if (typeof image_url === "string") return image_url;
  if (typeof image_url === "object" && image_url !== null && "url" in image_url) {
    const u = (image_url as { url?: string }).url;
    return typeof u === "string" ? u : null;
  }
  return null;
};

const normalizeRow = (row: ProfileRow): Profile => ({
  id: row.id,
  full_name: row.full_name ?? null,
  email: row.email ?? null,
  phone: row.phone ?? row.phone_number ?? null,
  avatar_url: normalizeAvatarUrl(row.avatar_url ?? null, row.image_url),
  account_type: row.account_type ?? null,
  preferred_currency: row.preferred_currency ?? "TZS",
  onboarding_completed: row.onboarding_completed ?? false,
  created_at: row.created_at,
  updated_at: row.updated_at ?? null,
});

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (existing) {
      setProfile(normalizeRow(existing as ProfileRow));
      setLoading(false);
      return;
    }

    // Create profile if missing (first login)
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        is_active: true,
        is_deleted: false,
      })
      .select()
      .single();

    if (insertError) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(normalizeRow(inserted as ProfileRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, refetch };
};
