import { useMemo } from "react";
import React, { useContext, useEffect, useState } from "react";
import { DisplayAdsContext } from "./display-ads-context";
import { useAppColors } from "@/components/user-preferences-context";
import type { AppColorTheme } from "@/assets/styles/timer-app";

import { View, Text, FlatList, StyleSheet } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import PackageItem from "./package-item";
/*
 The paywall for the current offering. Entitlement state is owned entirely by
 DisplayAdsProvider (which also subscribes to the SDK's customer-info updates),
 so this screen only lists what is for sale and reflects `displayAds`.
 */
const PaywallScreen = () => {
  const colorTheme = useAppColors();
  const styles = useMemo(() => makeStyles(colorTheme), [colorTheme]);
  const { displayAds } = useContext(DisplayAdsContext);

  // - State for all available package
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  // - State for displaying an overlay view
  const [isPurchasing, setIsPurchasing] = useState(false);
  // Offerings need the network. Report a failure inline rather than in an Alert.
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    // Get current available packages. The entitlement check that used to live
    // here as well was a duplicate of DisplayAdsProvider's — same call, same
    // cache write, one more place to keep in step. The provider owns it.
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
        setLoadError(true);
        console.error("Error getting offers", errorMessage);
      }
    };

    void getPackages();
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
        {displayAds && loadError && packages.length === 0 && (
          <Text style={styles.text}>
            Couldn&apos;t load the store right now — check your connection and
            reopen this screen.
          </Text>
        )}
        {isPurchasing && <View style={styles.overlay} />}
      </View>
    </View>
  );
};
const makeStyles = (colorTheme: AppColorTheme) =>
  StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 8,
  },
  purchaseTitle: {
    color: colorTheme.activeTimerPrimary,
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
