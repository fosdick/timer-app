import { useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { UserMenu } from "@/components/user-menu";
import { useAppColors } from "@/components/user-preferences-context";
import type { AppColorTheme } from "@/assets/styles/timer-app";

/**
 * The header's title view: the screen title, with the account button parked at
 * the right edge.
 *
 * Why the account button is HERE and not in `headerRight`: on iOS 26 anything in
 * headerRight is wrapped in a UIBarButtonItem, and the system paints its shared
 * background behind it — in the DARK variant, because app.json sets
 * userInterfaceStyle "dark" — while we paint the bar pale. Measured #6A7071, i.e.
 * black at ~55% over the header. It also clips the custom view to the item's
 * bounds, which is what flattened the bottom of the pronoun glyph.
 *
 * That background cannot be covered from JS. It sizes itself to our LAYOUT box
 * plus roughly 7pt on every side, so it is always larger than anything we draw,
 * and the clip means a negative margin paints nothing extra — verified on device,
 * which left a white square inside a grey circle. A title view gets none of this
 * treatment, so moving the button is the fix rather than a workaround.
 *
 * `RESERVED` keeps the row clear of the native back button on the left and the
 * screen edge on the right; the title stays optically centred because the row is
 * symmetric.
 */
const RESERVED = 112;

export function HeaderTitle({ title }: { title: string }) {
  const c = useAppColors();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={[styles.row, { width: Math.max(180, width - RESERVED) }]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        <UserMenu />
      </View>
    </View>
  );
}

const makeStyles = (c: AppColorTheme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
    title: { color: c.headerInk, fontSize: 17, fontWeight: "600" },
    // Absolute so the title stays centred on the ROW rather than being pushed
    // off-centre by the button's width.
    right: { position: "absolute", right: 0 },
  });
