import { useMemo } from "react";
/**
 * Header account menu (top-right). Replaces the settings gear: a user glyph that
 * opens a small dropdown with "User Preferences" and "App Settings". App Settings
 * is the existing settings page (promo / purchases / support).
 */
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { UserSvg } from "@/assets/images/svgx/user";
import { useAppColors, useUserPreferences } from "@/components/user-preferences-context";
import type { AppColorTheme } from "@/assets/styles/timer-app";

export const UserMenu = () => {
  const colorTheme = useAppColors();
  const { prefs } = useUserPreferences();
  const styles = useMemo(() => makeStyles(colorTheme), [colorTheme]);
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
        testID="account-menu-button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
      >
        {/* The grey pill behind this is UIKit's, not ours: app.json sets
            userInterfaceStyle "dark", so iOS renders the bar-button shared
            background in its DARK variant — measured #6A7071, which is black at
            ~55% over the header — even though we paint the bar pale. It also
            clips, which is where the glyph's flat bottom came from.

            So: paint our own disc in the HEADER's own colour and let it overflow
            its layout box (negative margin) to cover the system pill. The result
            is a seamless header with just the glyph on it. */}
        <View style={styles.disc}>
          <UserSvg pronoun={prefs.pronoun} width={26} height={26} />
        </View>
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
              testID="menu-user-preferences"
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => go("/user-preferences")}
            >
              <Text style={styles.itemText}>User Preferences</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              testID="menu-app-settings"
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

const makeStyles = (colorTheme: AppColorTheme) =>
  StyleSheet.create({
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
    borderColor: colorTheme.outline,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 4,
  },
  button: { paddingHorizontal: 0, paddingVertical: 0 },
  buttonPressed: { opacity: 0.6 },
  disc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    // Same colour as the header bar, so the button reads as part of it.
    backgroundColor: colorTheme.headerLiteShade,
    // Paints wider than it lays out: the system pill sizes to our LAYOUT box, so
    // shrinking that while keeping the painted disc large is what covers it.
    margin: -7,
  },
  item: { paddingHorizontal: 18, paddingVertical: 14 },
  itemPressed: { opacity: 0.6 },
  itemText: { color: colorTheme.headerLiteShade, fontSize: 16, fontWeight: "500" },
  divider: { height: 1, backgroundColor: colorTheme.borderColor, opacity: 0.4 },
});
