import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import Purchases from "react-native-purchases";
import { useNavigation } from "@react-navigation/native";
import { Constants } from "@/constants/constants";
import { getData, storeData } from "../assets/utils/persistant-storage";
const ENTITLEMENT_ID = Constants.ENTITLEMENT_ID;

const PackageItem = ({
  purchasePackage,
  setIsPurchasing,
  setRemoveAds,
}: any) => {
  const {
    product: { title, description, priceString },
  } = purchasePackage;

  const navigation = useNavigation();

  const onSelection = async () => {
    setIsPurchasing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);

      if (
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
      ) {
        // purchase is active, do stuff
        storeData(Constants.REMOVE_ADS_DATA_KEY, {
          removeAds: true,
          appUserId: customerInfo.originalAppUserId,
          message: JSON.stringify(customerInfo),
        });
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert(e.message);
      if (e.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        Alert.alert("Error purchasing package", e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Pressable onPress={onSelection} style={styles.container}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.terms}>{description}</Text>
      </View>
      <Text style={styles.title}>{priceString}</Text>
    </Pressable>
  );
};

import { StyleSheet } from "react-native";

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
