/**
 * Wiring tests for how ads get turned OFF — the money path, and the one part of
 * the app that is hardest to exercise end-to-end (real purchases need a sandbox
 * Apple account and a device; a non-consumable can only be bought once per
 * account, so even then the flows are awkward to re-run).
 *
 * PRIORITY NOTE: nearly every real user today arrives via a granted promo code,
 * not a purchase. That path had ZERO assertions before this file — the promo
 * tests only covered the input field clearing. So "a remove-ads promo hides the
 * ads" leads, and the purchase/restore flows follow.
 *
 * These tests drive the mocked react-native-purchases surface from
 * jest.setup.js. They verify OUR wiring — which call is made, what state it
 * produces, what reaches storage — not the SDK, and not StoreKit.
 */
import React, { useContext } from "react";
import { Text } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import Purchases from "react-native-purchases";

import { DisplayAdsProvider, DisplayAdsContext } from "../display-ads-context";
import RestorePurchasesButton from "../restore-purchases-button";
import PackageItem from "../package-item";
import { Constants } from "@/constants/constants";
import { getData, storeData } from "../../assets/utils/persistent-storage";
import { loadActivePromos } from "@/assets/data/promo-codes";

jest.mock("../../assets/utils/persistent-storage", () => ({
  getData: jest.fn(async () => null),
  storeData: jest.fn(async () => {}),
}));

jest.mock("@/assets/data/promo-codes", () => ({
  ...jest.requireActual("@/assets/data/promo-codes"),
  loadActivePromos: jest.fn(async () => []),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purchases = Purchases as any;
const mockGetData = getData as jest.Mock;
const mockStoreData = storeData as jest.Mock;

const ENTITLED = {
  entitlements: { active: { [Constants.ENTITLEMENT_IDENTIFIER]: { isActive: true } } },
  originalAppUserId: "entitled-user",
};
const NOTHING_OWNED = {
  entitlements: { active: {} },
  originalAppUserId: "broke-user",
};

/**
 * Stands in for BannerAdsView: renders the ad marker under exactly the same
 * condition the real one uses (`adsResolved && displayAds`), so a change to that
 * gate breaks these tests rather than silently reintroducing the launch flash.
 */
const AdProbe = () => {
  const { displayAds, adsResolved } = useContext(DisplayAdsContext);
  return (
    <>
      {adsResolved && displayAds ? <Text>AD</Text> : null}
      <Text>{adsResolved ? "resolved" : "pending"}</Text>
    </>
  );
};

const renderWithProvider = (ui: React.ReactNode) =>
  render(<DisplayAdsProvider>{ui}</DisplayAdsProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  // Several tests make the SDK throw on purpose; the code logs those, and the
  // logs are not the thing under test.
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Default world: SDK reachable, nothing owned, no promo, no cache.
  purchases.getCustomerInfo.mockResolvedValue(NOTHING_OWNED);
  purchases.restorePurchases.mockResolvedValue(NOTHING_OWNED);
  purchases.purchasePackage.mockResolvedValue({ customerInfo: NOTHING_OWNED });
  purchases.addCustomerInfoUpdateListener.mockImplementation(() => {});
  mockGetData.mockResolvedValue(null);
  mockStoreData.mockResolvedValue(undefined);
  (loadActivePromos as jest.Mock).mockResolvedValue([]);
});

describe("promo codes — the path essentially every real user is on", () => {
  it("an active remove-ads promo hides the ads", async () => {
    (loadActivePromos as jest.Mock).mockResolvedValue(["remove-ads"]);

    renderWithProvider(<AdProbe />);

    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.queryByText("AD")).toBeNull();
  });

  it("hides ads on a promo even when RevenueCat is unreachable", async () => {
    // The promo/cache checks live in a `finally`, so they must still run when
    // the entitlement lookup throws (offline, or SDK never configured).
    purchases.getCustomerInfo.mockRejectedValue(new Error("offline"));
    (loadActivePromos as jest.Mock).mockResolvedValue(["remove-ads"]);

    renderWithProvider(<AdProbe />);

    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.queryByText("AD")).toBeNull();
  });

  it("shows ads with no promo, no purchase and no cache", async () => {
    renderWithProvider(<AdProbe />);

    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.getByText("AD")).toBeTruthy();
  });
});

describe("launch", () => {
  it("renders NO ad before the first check resolves (no cold-launch flash)", async () => {
    // The bug this guards: displayAds starts optimistically true, so an entitled
    // user saw a banner mount and then vanish on every launch.
    let release: (v: unknown) => void = () => {};
    purchases.getCustomerInfo.mockReturnValue(new Promise((r) => { release = r; }));

    renderWithProvider(<AdProbe />);

    expect(screen.getByText("pending")).toBeTruthy();
    expect(screen.queryByText("AD")).toBeNull(); // <- the flash

    await act(async () => { release(ENTITLED); });
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.queryByText("AD")).toBeNull();
  });

  it("an active entitlement hides ads and seeds the offline cache", async () => {
    purchases.getCustomerInfo.mockResolvedValue(ENTITLED);

    renderWithProvider(<AdProbe />);

    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.queryByText("AD")).toBeNull();
    expect(storeData).toHaveBeenCalledWith(Constants.REMOVE_ADS_DATA_KEY, {
      removeAds: true,
    });
  });

  it("falls back to the cached flag when offline", async () => {
    purchases.getCustomerInfo.mockRejectedValue(new Error("offline"));
    mockGetData.mockResolvedValue({ removeAds: true });

    renderWithProvider(<AdProbe />);

    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.queryByText("AD")).toBeNull();
  });

  it("subscribes to SDK customer-info updates", async () => {
    renderWithProvider(<AdProbe />);
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(purchases.addCustomerInfoUpdateListener).toHaveBeenCalled();
  });

  it("an entitlement arriving via the listener hides the ads", async () => {
    // This is what makes restore (and family sharing, and a purchase made
    // anywhere else) take effect without the call site remembering to say so.
    let notify: ((info: unknown) => void) | undefined;
    purchases.addCustomerInfoUpdateListener.mockImplementation((cb: (i: unknown) => void) => {
      notify = cb;
    });

    renderWithProvider(<AdProbe />);
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.getByText("AD")).toBeTruthy();

    await act(async () => { notify?.(ENTITLED); });
    await waitFor(() => expect(screen.queryByText("AD")).toBeNull());
  });
});

describe("restore purchases", () => {
  it("a successful restore hides the ads immediately", async () => {
    // THE regression net. This failed before the fix: restorePurchases()'s
    // return value was discarded, so ads stayed up until the next cold launch.
    purchases.restorePurchases.mockResolvedValue(ENTITLED);

    renderWithProvider(
      <>
        <AdProbe />
        <RestorePurchasesButton />
      </>,
    );
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());
    expect(screen.getByText("AD")).toBeTruthy();

    await act(async () => { fireEvent.press(screen.getByTestId("restore-purchases")); });

    await waitFor(() => expect(screen.queryByText("AD")).toBeNull());
    expect(storeData).toHaveBeenCalledWith(Constants.REMOVE_ADS_DATA_KEY, {
      removeAds: true,
    });
  });

  it("says so when the Apple ID owns nothing to restore", async () => {
    purchases.restorePurchases.mockResolvedValue(NOTHING_OWNED);

    renderWithProvider(
      <>
        <AdProbe />
        <RestorePurchasesButton />
      </>,
    );
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByTestId("restore-purchases")); });

    await waitFor(() => expect(screen.getByText("No purchases found")).toBeTruthy());
    expect(screen.getByText("AD")).toBeTruthy(); // still showing, correctly
    expect(storeData).not.toHaveBeenCalled();
  });

  it("surfaces a failed restore instead of failing silently", async () => {
    purchases.restorePurchases.mockRejectedValue(new Error("Network error"));

    renderWithProvider(
      <>
        <AdProbe />
        <RestorePurchasesButton />
      </>,
    );
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByTestId("restore-purchases")); });

    await waitFor(() => expect(screen.getByText("Network error")).toBeTruthy());
    expect(screen.getByText("AD")).toBeTruthy();
  });
});

describe("purchase", () => {
  const pkg = {
    identifier: "remove_ads",
    product: {
      title: "Remove Ads",
      description: "Remove all ads. One-time purchase.",
      priceString: "$0.99",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it("a completed purchase hides the ads and caches the unlock", async () => {
    purchases.purchasePackage.mockResolvedValue({ customerInfo: ENTITLED });

    renderWithProvider(
      <>
        <AdProbe />
        <PackageItem purchasePackage={pkg} setIsPurchasing={() => {}} />
      </>,
    );
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByText("Remove Ads")); });

    await waitFor(() => expect(screen.queryByText("AD")).toBeNull());
    expect(storeData).toHaveBeenCalledWith(Constants.REMOVE_ADS_DATA_KEY, {
      removeAds: true,
      appUserId: ENTITLED.originalAppUserId,
    });
  });

  it("a cancelled purchase leaves ads on and writes nothing", async () => {
    purchases.purchasePackage.mockRejectedValue(new Error("Purchase cancelled"));

    renderWithProvider(
      <>
        <AdProbe />
        <PackageItem purchasePackage={pkg} setIsPurchasing={() => {}} />
      </>,
    );
    await waitFor(() => expect(screen.getByText("resolved")).toBeTruthy());

    await act(async () => { fireEvent.press(screen.getByText("Remove Ads")); });

    await waitFor(() => expect(purchases.purchasePackage).toHaveBeenCalled());
    expect(screen.getByText("AD")).toBeTruthy();
    expect(storeData).not.toHaveBeenCalled();
  });
});
