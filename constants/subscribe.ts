export {
  getBillingIntervalChangeNote,
  getPlanLimitReachedMessage,
  getSubscribeIntervalLabel,
  getSubscribePeriodSuffix,
  getUpgradeWhatsAppUrl,
} from "@/lib/i18n/subscribe-helpers";

import { CONTACT_US_WHATSAPP_URL } from "@/constants/values";
import { getUpgradeWhatsAppUrl } from "@/lib/i18n/subscribe-helpers";

export const getUpgradeWhatsAppUrlFromContact = (planName?: string, intervalLabel?: string) =>
  getUpgradeWhatsAppUrl(CONTACT_US_WHATSAPP_URL, planName, intervalLabel);
