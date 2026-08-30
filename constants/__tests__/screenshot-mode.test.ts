/**
 * The one thing that matters about screenshot mode: it is OFF unless a build
 * deliberately turned it on. A build that shipped with it on would disable ads
 * for every user, silently, with nothing in the UI to reveal it.
 */
describe("screenshot mode", () => {
  // The flag is read at module scope, so the module has to be re-evaluated after
  // each change to the env var — a plain top-level import would freeze the first
  // value and make every case below pass vacuously.
  const reload = (): boolean => {
    let on = false;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      on = (require("../screenshot-mode") as typeof import("../screenshot-mode"))
        .SCREENSHOT_MODE;
    });
    return on;
  };

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SCREENSHOT_MODE;
  });

  it("is off when the variable is unset — the shipping default", () => {
    delete process.env.EXPO_PUBLIC_SCREENSHOT_MODE;
    expect(reload()).toBe(false);
  });

  it("is off for anything other than an exact \"1\"", () => {
    // Guard against a truthiness check creeping in: "0" and "false" are both
    // truthy strings, and `!!process.env.X` would enable ads-off for both.
    for (const v of ["0", "false", "", "true", "yes"]) {
      process.env.EXPO_PUBLIC_SCREENSHOT_MODE = v;
      expect({ value: v, on: reload() }).toEqual({ value: v, on: false });
    }
  });

  it("is on only for \"1\"", () => {
    process.env.EXPO_PUBLIC_SCREENSHOT_MODE = "1";
    expect(reload()).toBe(true);
  });
});
