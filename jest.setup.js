// Shared jest setup for the wiring-test tier (RNTL render tests).
//
// Native modules that aren't present under jest get stubbed here ONCE so every
// test that renders a real component subtree (which transitively pulls in
// storage / purchases) works without per-file boilerplate. Pure-logic tests in
// assets/ don't need any of this, but loading it for them is harmless.

// Official AsyncStorage jest mock — an in-memory key/value store.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// react-native-purchases is a native SDK with no jest binding. Every method is a
// jest.fn() with a benign default (configured, nothing owned, nothing on offer)
// so components that merely IMPORT it keep rendering, while a test that cares
// about purchase flow can drive each call — see
// components/__tests__/purchases-and-promos.test.tsx. Tests should set the
// implementations they depend on explicitly rather than leaning on these
// defaults staying put.
jest.mock("react-native-purchases", () => {
  const NOTHING_OWNED = {
    entitlements: { active: {} },
    originalAppUserId: "jest-app-user",
  };
  return {
    __esModule: true,
    LOG_LEVEL: { VERBOSE: "VERBOSE", DEBUG: "DEBUG", INFO: "INFO", WARN: "WARN", ERROR: "ERROR" },
    default: {
      configure: jest.fn(),
      setLogLevel: jest.fn(),
      getCustomerInfo: jest.fn(async () => NOTHING_OWNED),
      getOfferings: jest.fn(async () => ({ current: null })),
      purchasePackage: jest.fn(async () => ({ customerInfo: NOTHING_OWNED })),
      restorePurchases: jest.fn(async () => NOTHING_OWNED),
      addCustomerInfoUpdateListener: jest.fn(),
      removeCustomerInfoUpdateListener: jest.fn(),
    },
  };
});
