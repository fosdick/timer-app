// https://docs.expo.dev/guides/using-eslint/
//
// Flat config. ESLint 9 dropped .eslintrc support, so `npm run lint` had been
// failing outright ("couldn't find eslint.config.js") since the v9 bump — this
// restores it, carrying over the same intent as the old .eslintrc.js: Expo's
// rules everywhere, plus @typescript-eslint/recommended on .ts/.tsx.
//
// Wired from @typescript-eslint/eslint-plugin's own flat configs rather than the
// `typescript-eslint` meta package, deliberately: adding a dependency here risks
// the parent-directory node_modules shadowing described in docs/ — the plugin and
// parser are already direct devDependencies, so no install is needed.
const expoConfig = require("eslint-config-expo/flat");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  ...expoConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: tsPlugin.configs["flat/recommended"].reduce(
      (acc, c) => ({ ...acc, ...(c.rules ?? {}) }),
      {},
    ),
  },
  {
    // Test files and the shared jest setup run under jest, not the app runtime,
    // so its globals need declaring or every `jest.mock` is a no-undef error.
    files: [
      "**/__tests__/**/*.{js,ts,tsx}",
      "**/*.test.{js,ts,tsx}",
      "jest.setup.js",
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        require: "readonly",
        module: "writable",
      },
    },
  },
  {
    // Node build scripts, not app runtime — CommonJS globals need declaring or
    // every __dirname is a no-undef error.
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
      },
    },
  },
  {
    // Not app source: dormant internal tooling, build output, native projects.
    ignores: [
      "dist/*",
      "web-build/*",
      "admin/*",
      "server/dist/*",
      "python-api/*",
      "ios/*",
      "android/*",
      "expo-env.d.ts",
    ],
  },
];
