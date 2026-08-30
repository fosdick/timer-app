/**
 * Screenshot mode — ads off, for App Store capture only.
 *
 * The store panels were shipping with a live AdMob TEST banner in them: a white
 * strip with a "Test mode" badge and someone else's brand, in three of six
 * panels. Which panels got one depended on how fast the ad loaded, so it was a
 * race rather than a rule.
 *
 * Store screenshots should show what a paying customer sees, so this forces the
 * ad gate off. It is compiled in from an EXPO_PUBLIC_ env var, which Expo inlines
 * at BUILD time — there is no runtime switch, nothing in the UI, and no way for a
 * user to reach it.
 *
 * THE RISK IS SHIPPING A BUILD WITH THIS ON: ads would be silently disabled in
 * production for everyone. Three things guard that, and none of them is a comment:
 *   - it defaults to false, asserted in __tests__/screenshot-mode.test.ts
 *   - scripts/preflight.sh fails when the variable is set
 *   - scripts/screenshots.sh is the only thing that sets it, and only for its own
 *     build
 */
export const SCREENSHOT_MODE = process.env.EXPO_PUBLIC_SCREENSHOT_MODE === "1";
