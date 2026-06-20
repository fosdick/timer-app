/**
 * Header account menu (top-right). Replaces the settings gear: a user glyph that
 * opens a small dropdown with "User Preferences" and "App Settings". App Settings
 * is the existing settings page (promo / purchases / support).
 */
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { UserSvg } from "@/assets/images/svgx/user";
import { colorTheme } from "@/assets/styles/timer-app";

export const UserMenu = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const go = (path: "/user-preferences" | "/settings") => {
    setOpen(false);
    // Cast: typed-routes haven't regenerated for /user-preferences until the
    // next expo build; the route resolves fine at runtime.
    router.push(path as Href);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          paddingHorizontal: 12,
          paddingVertical: 8,
          opacity: pressed ? 0.6 : 1,
        })}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
      >
        <UserSvg />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Tap anywhere outside the menu to dismiss. */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => go("/user-preferences")}
            >
              <Text style={styles.itemText}>User Preferences</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => go("/settings")}
            >
              <Text style={styles.itemText}>App Settings</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Full-screen catcher that parks the menu under the header, top-right.
  backdrop: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 96,
    paddingRight: 10,
  },
  menu: {
    minWidth: 200,
    backgroundColor: colorTheme.backgroundColor,
    borderWidth: 1,
    borderColor: colorTheme.borderColor,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 4,
  },
  item: { paddingHorizontal: 18, paddingVertical: 14 },
  itemPressed: { opacity: 0.6 },
  itemText: { color: colorTheme.headerLiteShade, fontSize: 16, fontWeight: "500" },
  divider: { height: 1, backgroundColor: colorTheme.borderColor, opacity: 0.4 },
});
