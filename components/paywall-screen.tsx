import React, { useContext, useEffect, useState } from "react";
import { DisplayAdsContext } from "./display-ads-context";
import { storeData } from "../assets/utils/persistent-storage";
import { Constants } from "@/constants/constants";

import { View, Text, FlatList, StyleSheet, Alert } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import PackageItem from "./package-item";
/*
 An example paywall that uses the current offering.
 */
const PaywallScreen = () => {
  const { displayAds, setDisplayAds } = useContext(DisplayAdsContext);

  // - State for all available package
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);
  useEffect(() => {
    // Get current available packages
    const getPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (
          offerings.current !== null &&
          offerings.current.availablePackages.length !== 0
        ) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An error occurred';
        Alert.alert(errorMessage);
        console.error("Error getting offers", errorMessage);
      }
    };

    getPackages();

    const checkPurchases = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (
          typeof customerInfo.entitlements.active[
            Constants.ENTITLEMENT_IDENTIFIER
          ] !== "undefined"
        ) {
          // do not show adds
          setDisplayAds(false);
          // save in cache
          await storeData(Constants.REMOVE_ADS_DATA_KEY, { removeAds: true });
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error("Error fetching customer info", errorMessage);
      }
    };
    checkPurchases();
  }, [setDisplayAds]);

  return (
    <View>
      <View style={styles.container}>
        {displayAds && <Text style={styles.purchaseTitle}>Remove Ads</Text>}
        {!displayAds && (
          <Text style={styles.purchaseTitle}>Thank you for purchasing!</Text>
        )}
      </View>
      <View style={styles.page}>
        {/* The paywall flat list displaying each package */}
        {displayAds && (
          <FlatList
            data={packages}
            renderItem={({ item }) => (
              <PackageItem
                purchasePackage={item}
                setIsPurchasing={setIsPurchasing}
              />
            )}
            keyExtractor={(item) => item.identifier}
          />
        )}
        {isPurchasing && <View style={styles.overlay} />}
      </View>
    </View>
  );
};
const tintColorLight = "#0a7ea4";
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 8,
  },
  purchaseTitle: {
    color: tintColorLight,
    fontSize: 24,
    fontWeight: "normal",
    borderBottomWidth: 1,
    borderBottomColor: "#687076",
    // paddingTop: 100,
    alignItems: "center",
  },
  terms: {
    color: "darkgrey",
  },
  page: {
    padding: 16,
  },
  text: {
    color: "lightgrey",
  },
  headerFooterContainer: {
    marginVertical: 10,
  },
  overlay: {
    flex: 1,
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
    backgroundColor: "black",
  },
});
export default PaywallScreen;
