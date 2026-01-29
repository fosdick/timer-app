import React, { createContext, useState } from "react";
import { Constants } from "@/constants/constants";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { getData } from "../assets/utils/persistent-storage";

type DisplayAdsContextType = {
  displayAds: boolean;
  setDisplayAds?: (value: boolean) => void;
  customerInfoData?: CustomerInfo;
};
const DisplayAdsContext = createContext<DisplayAdsContextType>({
  displayAds: true,
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
