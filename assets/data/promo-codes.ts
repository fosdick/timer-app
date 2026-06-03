/**
 * Promo Codes
 *
 * Plaintext-constant promo codes for testers / beta users. A code grants
 * a specific perk (currently: remove-ads). Future perks can be added by
 * appending to PROMO_DEFS — the storage + UI handle a list of activated
 * promos generically.
 *
 * Why plaintext: the app has ~2 users and zero revenue at stake. Hashing
 * the code would add ceremony (a generator script, regeneration when codes
 * rotate) without meaningful security benefit — anyone determined enough
 * to decompile the bundle isn't the threat model. If/when there's real
 * money on the line, do server-side validation instead, not client hashing.
 *
 * Promos are tracked independently from purchases: a user with both an
 * active "remove-ads" promo AND an active App Store purchase keeps ads
 * off until BOTH are revoked. See display-ads-context for the OR logic.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type PromoId = "remove-ads";
// Future: | "custom-flows" | "video-content" | ...

export interface PromoDef {
  id: PromoId;
  code: string;
  name: string;
  description: string;
}

export const PROMO_DEFS: PromoDef[] = [
  {
    id: "remove-ads",
    code: "flowfree",
    name: "Remove Ads",
    description: "Permanently hides banner and interstitial ads.",
  },
];

const ACTIVE_PROMOS_KEY = "active_promos";

// ─── Lookup ──────────────────────────────────────────────────────────────────

/**
 * Find a promo by user-entered code. Case-insensitive + whitespace-trimmed
 * so users can type "flowfree", " FlowFree ", "FLOWFREE" and all match.
 */
export const findPromoByCode = (input: string): PromoDef | null => {
  const normalized = input.trim().toLowerCase();
  if (normalized === "") return null;
  return (
    PROMO_DEFS.find((p) => p.code.toLowerCase() === normalized) ?? null
  );
};

export const getPromoDef = (id: PromoId): PromoDef | undefined => {
  return PROMO_DEFS.find((p) => p.id === id);
};

// ─── Active-promos storage ───────────────────────────────────────────────────

export const loadActivePromos = async (): Promise<PromoId[]> => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_PROMOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter to only ids that still exist in PROMO_DEFS (handles stale ids
    // after a code is removed from the app in a future release)
    const known = new Set(PROMO_DEFS.map((p) => p.id));
    return parsed.filter((id): id is PromoId => known.has(id as PromoId));
  } catch {
    return [];
  }
};

const persistActivePromos = async (ids: PromoId[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACTIVE_PROMOS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

export const activatePromo = async (id: PromoId): Promise<void> => {
  const current = await loadActivePromos();
  if (current.includes(id)) return;
  await persistActivePromos([...current, id]);
};

export const deactivatePromo = async (id: PromoId): Promise<void> => {
  const current = await loadActivePromos();
  await persistActivePromos(current.filter((p) => p !== id));
};

export const isPromoActive = async (id: PromoId): Promise<boolean> => {
  const active = await loadActivePromos();
  return active.includes(id);
};
