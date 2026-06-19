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

// react-native-purchases is a native SDK with no jest binding; components that
// import it (e.g. display-ads-context) only need it to not throw on import.
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
