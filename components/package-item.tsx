import React, { useContext, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { Constants } from "@/constants/constants";
import { storeData } from "../assets/utils/persistent-storage";
import { DisplayAdsContext } from "./display-ads-context";

import { StyleSheet } from "react-native";

interface PackageItemProps {
  purchasePackage: PurchasesPackage;
  setIsPurchasing: (value: boolean) => void;
}

const PackageItem = ({ purchasePackage, setIsPurchasing }: PackageItemProps) => {
  const {
    product: { title, description, priceString },
  } = purchasePackage;
  const { setDisplayAds } = useContext(DisplayAdsContext);
  const [msg, setMsg] = useState("debug: ");
  const onSelection = async () => {
    setIsPurchasing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
      setMsg(msg + JSON.stringify(customerInfo));
      if (
        typeof customerInfo.entitlements.active[
          Constants.ENTITLEMENT_IDENTIFIER
        ] !== "undefined"
      ) {
        // purchase is active, do stuff
        setDisplayAds(false);
        storeData(Constants.REMOVE_ADS_DATA_KEY, {
          removeAds: true,
          appUserId: customerInfo.originalAppUserId,
          message: JSON.stringify(customerInfo),
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
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.terms}>{description}</Text>
        </View>
        <Text style={styles.title}>{priceString}</Text>
      </Pressable>
      {/* <Text selectable>
        {msg}
        {title}
        {JSON.stringify(purchasePackage)}
      </Text> */}
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
