import React, { useContext } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { Constants } from "@/constants/constants";
import { storeData } from "../assets/utils/persistent-storage";
import { DisplayAdsContext } from "./display-ads-context";

interface PackageItemProps {
  purchasePackage: PurchasesPackage;
  setIsPurchasing: (value: boolean) => void;
}

const PackageItem = ({ purchasePackage, setIsPurchasing }: PackageItemProps) => {
  const {
    product: { title, description, priceString },
  } = purchasePackage;
  // The App Store Connect *display name* for this product is currently the string
  // "U.S." — the storefront region was typed into the name field — so rendering
  // product.title put a meaningless heading on the paywall row, right above a
  // sign-in prompt. The description carries the real meaning ("Remove ads from
  // TimerAppYoga"), so lead with that and fall back only if a storefront ever
  // ships an empty one. Fixed here rather than in ASC by the owner's call.
  const label = description?.trim() || title?.trim() || "Remove Ads";
  const { setDisplayAds } = useContext(DisplayAdsContext);
  const onSelection = async () => {
    setIsPurchasing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
      if (
        typeof customerInfo.entitlements.active[
          Constants.ENTITLEMENT_IDENTIFIER
        ] !== "undefined"
      ) {
        // purchase is active, do stuff
        setDisplayAds(false);
        // appUserId only — the full customerInfo used to be stringified in here,
        // which stored a growing blob of account data for no reader.
        await storeData(Constants.REMOVE_ADS_DATA_KEY, {
          removeAds: true,
          appUserId: customerInfo.originalAppUserId,
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred';
      Alert.alert(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View>
      <Pressable onPress={onSelection} style={styles.container}>
        <View style={styles.labelWrap}>
          <Text style={styles.title}>{label}</Text>
        </View>
        <Text style={styles.title}>{priceString}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#242424",
  },
  labelWrap: { flex: 1, paddingRight: 12 },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  terms: {
    color: "darkgrey",
  },
});

export default PackageItem;
