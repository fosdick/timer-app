import React, { createContext, useCallback, useEffect, useState } from "react";
import { SCREENSHOT_MODE } from "@/constants/screenshot-mode";
import { Platform } from "react-native";
import { Constants } from "@/constants/constants";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { getData, storeData } from "../assets/utils/persistent-storage";
import { loadActivePromos } from "@/assets/data/promo-codes";

type DisplayAdsContextType = {
  displayAds: boolean;
  setDisplayAds: (value: boolean) => void;
  /**
   * False until the first entitlement/cache/promo check has finished. Ad views
   * must render nothing while this is false: `displayAds` starts optimistically
   * `true`, so without this gate an entitled or promo user watched a banner
   * mount and then vanish on every cold launch.
   */
  adsResolved: boolean;
  customerInfoData?: CustomerInfo;
};

// No-op default so consumers can always call setDisplayAds without an undefined
// check. The provider always supplies a real setter, so this default only ever
// runs if someone consumes the context outside the provider tree.
const DisplayAdsContext = createContext<DisplayAdsContextType>({
  displayAds: true,
  setDisplayAds: () => {},
  adsResolved: false,
});

// RevenueCat is only configured on iOS (see app/_layout.tsx), so calling into it
// elsewhere just throws "no singleton instance" on every launch. The local cache
// and promo checks below still run on every platform.
const PURCHASES_AVAILABLE = Platform.OS === "ios";

const DisplayAdsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Screenshot builds start resolved and ad-free, so no banner ever mounts —
  // see constants/screenshot-mode.ts. In every normal build SCREENSHOT_MODE is
  // false and these are the original values.
  const [displayAds, setDisplayAds] = useState(!SCREENSHOT_MODE);
  const [adsResolved, setAdsResolved] = useState(SCREENSHOT_MODE);
  const [customerInfoData, setCustomerInfoData] = useState<CustomerInfo>();

  const value: DisplayAdsContextType = {
    displayAds,
    setDisplayAds,
    adsResolved,
    customerInfoData,
  };

  // Does this customer hold the no-ads entitlement? Also mirrors an active
  // entitlement into local storage so the NEXT launch can turn ads off offline,
  // before (or without) any network round trip. This is the single place that
  // seeds that cache from entitlement state.
  const applyCustomerInfo = useCallback(async (info: CustomerInfo) => {
    setCustomerInfoData(info);
    const entitled =
      typeof info.entitlements.active[Constants.ENTITLEMENT_IDENTIFIER] !==
      "undefined";
    if (entitled) {
      setDisplayAds(false);
      await storeData(Constants.REMOVE_ADS_DATA_KEY, { removeAds: true });
    }
    return entitled;
  }, []);

  const checkPurchases = useCallback(async () => {
    try {
      if (PURCHASES_AVAILABLE) {
        // access latest customerInfo
        await applyCustomerInfo(await Purchases.getCustomerInfo());
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("Error fetching customer info", errorMessage);
    } finally {
      // Everything below can only turn ads OFF, never back on. That is
      // deliberate: for a one-off non-consumable, a stale "you paid" cache
      // failing open is far better than wrongly showing ads to someone who did.
      //
      // check local storage — maybe offline
      const removeAdsData = await getData(Constants.REMOVE_ADS_DATA_KEY);
      if (removeAdsData?.removeAds) {
        setDisplayAds(false);
      }
      // Also check for an active "remove-ads" promo — independent of purchase
      // state, so a tester/beta user keeps ads off via their granted code. This
      // is the path essentially every real user arrives on today.
      const activePromos = await loadActivePromos();
      if (activePromos.includes("remove-ads")) {
        setDisplayAds(false);
      }
      // Whatever the outcome, ad views may now render.
      setAdsResolved(true);
    }
  }, [applyCustomerInfo]);

  useEffect(() => {
    void checkPurchases();

    // The SDK's own notification for ANY entitlement change — a purchase, a
    // restore, family sharing, a refund processed in App Store Connect. This is
    // what makes "tap Restore Purchases and the ads go away immediately" work
    // without every call site remembering to update state itself.
    if (!PURCHASES_AVAILABLE) return;
    try {
      Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(applyCustomerInfo);
      };
    } catch (e: unknown) {
      // An unconfigured SDK (configure() failed) must not take the app down.
      console.error("Could not subscribe to customer info updates", e);
    }
  }, [checkPurchases, applyCustomerInfo]);

  return (
    <DisplayAdsContext.Provider value={value}>
      {children}
    </DisplayAdsContext.Provider>
  );
};

export { DisplayAdsProvider, DisplayAdsContext };
