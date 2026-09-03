interface ConstantsType {
  PURCHASES_API_KEY: string;
  ENTITLEMENT_IDENTIFIER: string;
  USER_SETTINGS_DATA: string;
  ADMOD_ADUNIT_ID: string;
  SUPPORT_EMAIL: string;
  REMOVE_ADS_DATA_KEY: string;
  CONTACT_EMAIL: string;
}

export const Constants: ConstantsType = {
  PURCHASES_API_KEY: "appl_UyuTSCzlxJTScOsnzdZYXCsGfQn",
  ENTITLEMENT_IDENTIFIER: "timer-app-yoga-no-ads",
  USER_SETTINGS_DATA: "user-settings-data",
  ADMOD_ADUNIT_ID: "ca-app-pub-9298793039154739/4696334699",
  SUPPORT_EMAIL: "app.support@fastmail.fm",
  REMOVE_ADS_DATA_KEY: "remove-ads-data-key",
  CONTACT_EMAIL: "timerapp.yoga@fastmail.fm",
};

/**
 * Yoga flows — ON for evaluation on dev-flow-eval, OFF everywhere else.
 *
 * The flag guards FOUR places, not just the button that opens the picker: the
 * restore-from-storage path at yoga-view.tsx:286 falls back to "manual" when
 * flows are off, which is what stops a stored flow id from re-entering flow mode
 * on a build where the UI cannot reach it. That leak is the reason this is a
 * single constant rather than scattered conditionals.
 */
export const YOGA_FLOW_ENABLED = true;
