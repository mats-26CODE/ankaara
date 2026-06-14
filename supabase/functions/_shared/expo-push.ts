// @ts-nocheck
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  data?: Record<string, unknown>;
};

export type UserPushNotificationContent = {
  title: string;
  body: string;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  data?: Record<string, unknown>;
  notificationType: string;
  businessId?: string | null;
};

export type ProfilePushTarget = {
  notification_token: string | null;
  full_name: string | null;
  preferred_language: string | null;
};

export const getFirstName = (name: string | null | undefined): string =>
  (name?.trim().split(/\s+/)[0] ?? "").trim();

export const sendExpoPush = async (message: ExpoPushMessage): Promise<void> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };

  const accessToken = Deno.env.get("EXPO_NOTIFICATIONS_ACCESS_TOKEN");
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...message,
      sound: message.sound ?? "default",
      priority: message.priority ?? "high",
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof result === "object" && result !== null && "message" in result
        ? String((result as { message?: unknown }).message)
        : `Expo push failed (${response.status})`;
    throw new Error(detail);
  }
};

export const loadProfilePushTarget = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfilePushTarget | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("notification_token, full_name, preferred_language")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[expo-push] profile load error", error);
    return null;
  }

  return data as ProfilePushTarget | null;
};

export const saveUserNotification = async (
  supabase: SupabaseClient,
  input: {
    userId: string;
    businessId?: string | null;
    type: string;
    title: string;
    body: string;
    deepLink?: string | null;
    data?: Record<string, unknown>;
  },
): Promise<boolean> => {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    business_id: input.businessId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    deep_link: input.deepLink ?? null,
    data: input.data ?? {},
  });

  if (error) {
    console.error("[expo-push] save notification error", error);
    return false;
  }

  return true;
};

export const sendExpoPushToUser = async (
  supabase: SupabaseClient,
  userId: string,
  buildMessage: (profile: ProfilePushTarget) => UserPushNotificationContent | null,
): Promise<{ sent: boolean; saved: boolean; reason?: string }> => {
  const profile = await loadProfilePushTarget(supabase, userId);
  const fallbackProfile: ProfilePushTarget = {
    notification_token: null,
    full_name: null,
    preferred_language: null,
  };

  const payload = buildMessage(profile ?? fallbackProfile);
  if (!payload) {
    return { sent: false, saved: false, reason: "message_skipped" };
  }

  const { notificationType, businessId, ...pushFields } = payload;
  const deepLink = typeof pushFields.data?.url === "string" ? pushFields.data.url : null;

  const saved = await saveUserNotification(supabase, {
    userId,
    businessId: businessId ?? null,
    type: notificationType,
    title: pushFields.title,
    body: pushFields.body,
    deepLink,
    data: pushFields.data ?? {},
  });

  if (!profile?.notification_token) {
    return { sent: false, saved, reason: "no_notification_token" };
  }

  await sendExpoPush({
    to: profile.notification_token,
    ...pushFields,
  });

  return { sent: true, saved };
};

export const createServiceSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
};

export const verifyPushWebhookSecret = (req: Request): boolean => {
  const secret = Deno.env.get("PUSH_NOTIFICATION_WEBHOOK_SECRET");
  if (!secret) return false;
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (bearer === secret) return true;
  const alt = req.headers.get("x-webhook-secret");
  return alt === secret;
};

export const parseMoney = (v: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.trim().replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};
