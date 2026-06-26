export const API_TIMEOUT = 10000; // 10 seconds
export const SUPPORT_EMAIL = "support@ankaara.app";
export const CAREERS_EMAIL = "careers@ankaara.app";
export const CONTACT_US_PHONE = "+255 676 805 186";
/** `tel:` link for {@link CONTACT_US_PHONE}. */
export const CONTACT_US_PHONE_TEL_HREF = `tel:${CONTACT_US_PHONE.replace(/\s/g, "")}`;
/** Digits-only for `https://wa.me/...` (must match {@link CONTACT_US_PHONE}). */
export const CONTACT_US_WHATSAPP_URL = `https://wa.me/${CONTACT_US_PHONE.replace(/\D/g, "")}`;
/** Official profiles (footer & support). */
export const CONTACT_US_INSTAGRAM_URL = "https://www.instagram.com/ankaara.app/";
export const CONTACT_US_FACEBOOK_URL = "https://www.facebook.com/ankaara.app";
export const CONTACT_US_ADDRESS = "Dar es Salaam, Tanzania";
export const APP_NAME = "Ankaara";
export const APP_URL = "https://ankaara.app";

/** App store listings (set to `#` until the apps are published). */
export const APP_STORE_URL = "#";
export const GOOGLE_PLAY_URL = "#";

/** Sidebar footer: `Copyright © 2026 Ankaara. All rights reserved.` */
export const getCopyrightNotice = (year = new Date().getFullYear()) =>
  `Copyright © ${year} ${APP_NAME}. All rights reserved.`;
export const PAYMENT_GATEWAY_URL = "https://snippe.sh";
export const PAYMENT_GATEWAY_NAME = "Snippe";
