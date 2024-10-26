import React, { createContext, useState } from "react";
import { Constants } from "@/constants/constants";
import Purchases from "react-native-purchases";
import { getData, storeData } from "../assets/utils/persistant-storage";

type DisplayAdsContextType = {
  displayAds: boolean;
  setDisplayAds?: any;
};
const DisplayAdsContext = createContext<DisplayAdsContextType>({
  displayAds: true,
});

const DisplayAdsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [displayAds, setDisplayAds] = useState(true);

  const value: DisplayAdsContextType = {
    displayAds,
    setDisplayAds,
  };

  const checkPurchases = async () => {
    try {
      // access latest customerInfo
      const customerInfo = await Purchases.getCustomerInfo();
      if (
        typeof customerInfo.entitlements.active[Constants.ENTITLEMENT_ID] !==
        "undefined"
      ) {
        // do not show adds
        setDisplayAds(true);
      }
    } catch (e: any) {
      console.error("Error fetching customer info", e.message);
    } finally {
      // check local storage
      // maybe off line
      const removeAdsData = await getData(Constants.REMOVE_ADS_DATA_KEY);
      if (removeAdsData?.removeAds) {
        setDisplayAds(true);
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
