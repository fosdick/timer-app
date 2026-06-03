import React, { createContext, useState } from "react";
import { Constants } from "@/constants/constants";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { getData } from "../assets/utils/persistent-storage";
import { loadActivePromos } from "@/assets/data/promo-codes";

type DisplayAdsContextType = {
  displayAds: boolean;
  setDisplayAds: (value: boolean) => void;
  customerInfoData?: CustomerInfo;
};
// No-op default so consumers can always call setDisplayAds without an undefined
// check. The provider always supplies a real setter, so this default only ever
// runs if someone consumes the context outside the provider tree.
const DisplayAdsContext = createContext<DisplayAdsContextType>({
  displayAds: true,
  setDisplayAds: () => {},
});

const DisplayAdsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [displayAds, setDisplayAds] = useState(true);
  const [customerInfoData, setCustomerInfoData] = useState<CustomerInfo>();

  const value: DisplayAdsContextType = {
    displayAds,
    setDisplayAds,
    customerInfoData,
  };

  const checkPurchases = async () => {
    try {
      // access latest customerInfo
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfoData(customerInfo);
      if (
        typeof customerInfo.entitlements.active[
          Constants.ENTITLEMENT_IDENTIFIER
        ] !== "undefined"
      ) {
        // do not show adds
        setDisplayAds(false);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error("Error fetching customer info", errorMessage);
    } finally {
      // check local storage
      // maybe off line
      const removeAdsData = await getData(Constants.REMOVE_ADS_DATA_KEY);
      if (removeAdsData?.removeAds) {
        setDisplayAds(false);
      }
      // Also check for an active "remove-ads" promo — independent of purchase
      // state, so a tester/beta user keeps ads off via their granted code.
      const activePromos = await loadActivePromos();
      if (activePromos.includes("remove-ads")) {
        setDisplayAds(false);
      }
    }
  };
  useState(async () => {
    await checkPurchases();
  });

  return (
    <DisplayAdsContext.Provider value={value}>
      {children}
    </DisplayAdsContext.Provider>
  );
};

export { DisplayAdsProvider, DisplayAdsContext };
