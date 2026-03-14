import { createClient } from "@/lib/supabase/client";

const BUCKET_ID = "business-logos";
const MAX_SIZE_BYTES = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const FOLDER_NAME = "businessLogos";

/**
 * Validates logo file: image type and max 1MB.
 */
export const validateBusinessLogoFile = (
  file: File,
): { ok: true } | { ok: false; error: string } => {
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: "Image must be 1MB or smaller." };
  }
  const type = file.type?.toLowerCase();
  if (!type || !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, error: "Please use a JPEG, PNG, or WebP image." };
  }
  return { ok: true };
};

/**
 * Builds storage path: {userId}/{businessId}/businessLogos/logo_{timestamp}.{ext}
 * Unique filename per upload so the URL changes and caches don't serve the old image.
 */
const getLogoStoragePath = (userId: string, businessId: string, extension: string) => {
  const ext = extension.replace(/^\./, "").toLowerCase() || "png";
  const unique = `logo_${Date.now()}.${ext}`;
  return `${userId}/${businessId}/${FOLDER_NAME}/${unique}`;
};

/**
 * Full path to the businessLogos folder for listing/removing.
 */
const getLogoFolderPath = (userId: string, businessId: string) =>
  `${userId}/${businessId}/${FOLDER_NAME}`;

/**
 * Resolve object path for remove(): Supabase list() may return name as full path or filename only.
 */
const getObjectPath = (folderPath: string, item: { name: string }) =>
  item.name.includes("/") ? item.name : `${folderPath}/${item.name}`;

/**
 * Uploads a business logo to Supabase Storage.
 * Uses a unique filename per upload so the stored URL changes (avoids cache showing old logo).
 * Removes any existing files in the businessLogos folder, then uploads the new file.
 */
export const uploadBusinessLogo = async (file: File, businessId: string): Promise<string> => {
  const validation = validateBusinessLogoFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to upload a logo.");
  }

  const userId = user.id;
  const ext = file.name.split(".").pop() || "png";
  const folderPath = getLogoFolderPath(userId, businessId);
  const path = getLogoStoragePath(userId, businessId, ext);

  const bucket = supabase.storage.from(BUCKET_ID);

  const { data: existing, error: listError } = await bucket.list(folderPath, { limit: 50 });
  if (listError) {
    throw new Error(listError.message || "Failed to list existing logo.");
  }
  const files = (existing ?? []).filter((item) => item.name != null) as { name: string }[];
  if (files.length > 0) {
    const toRemove = files.map((f) => getObjectPath(folderPath, f));
    const { error: removeError } = await bucket.remove(toRemove);
    if (removeError) {
      throw new Error(removeError.message || "Failed to remove previous logo.");
    }
  }

  const { error: uploadError } = await bucket.upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    throw new Error(uploadError.message || "Upload failed.");
  }

  const { data: urlData } = bucket.getPublicUrl(path);
  return urlData.publicUrl;
};

/**
 * Removes the business logo from storage (all files in the businessLogos folder).
 * Call this when switching to text logo or clearing the image.
 */
export const removeBusinessLogo = async (businessId: string): Promise<void> => {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to remove a logo.");
  }

  const folderPath = getLogoFolderPath(user.id, businessId);
  const bucket = supabase.storage.from(BUCKET_ID);
  const { data: list, error: listError } = await bucket.list(folderPath, { limit: 50 });
  if (listError) throw new Error(listError.message || "Failed to list logo.");
  const files = (list ?? []).filter((item) => item.name != null) as { name: string }[];
  if (files.length > 0) {
    const toRemove = files.map((f) => getObjectPath(folderPath, f));
    const { error: removeError } = await bucket.remove(toRemove);
    if (removeError) throw new Error(removeError.message || "Failed to remove logo.");
  }
};
