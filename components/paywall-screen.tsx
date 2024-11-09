import React, { useContext, useEffect, useState } from "react";
import { DisplayAdsContext, DisplayAdsProvider } from "./display-ads-context";
import { getData, storeData } from "../assets/utils/persistent-storage";
import { Constants } from "@/constants/constants";

import {
  View,
  Text,
  FlatList,
  Button,
  Linking,
  StyleSheet,
  Alert,
} from "react-native";
import Purchases from "react-native-purchases";
import PackageItem from "./package-item";
/*
 An example paywall that uses the current offering.
 */
const PaywallScreen = () => {
  const { displayAds, setDisplayAds } = useContext(DisplayAdsContext);

  // - State for all available package
  const [packages, setPackages] = useState<any>([]);
  const [offerings2, setOfferings] = useState<any>();
  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);
  useEffect(() => {
    // Get current available packages
    const getPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        setOfferings(offerings);
        if (
          offerings.current !== null &&
          offerings.current.availablePackages.length !== 0
        ) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e: any) {
        Alert.alert(e.message);
        console.error("Error getting offers", e.message);
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
      } catch (e: any) {
        console.error("Error fetching customer info", e.message);
      }
    };
    checkPurchases();
  }, []);

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
