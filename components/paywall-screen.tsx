import React, { useEffect, useState } from "react";
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
import { Constants } from "@/constants/constants";
/*
 An example paywall that uses the current offering.
 */
const PaywallScreen = () => {
  // - State for all available package
  const [packages, setPackages] = useState<any>([]);
  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [removeAds, setRemoveAds] = useState(false);
  useEffect(() => {
    // Get current available packages
    const getPackages = async () => {
      try {
        const offerings: any = await Purchases.getOfferings();
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
          typeof customerInfo.entitlements.active[Constants.ENTITLEMENT_ID] !==
          "undefined"
        ) {
          // do not show adds
          setRemoveAds(true);
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
        {!removeAds && <Text style={styles.purchaseTitle}>Remove Ads</Text>}
      </View>
      <View style={styles.page}>
        {/* The paywall flat list displaying each package */}
        {!removeAds && (
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
    fontSize: 36,
    fontWeight: "bold",
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
