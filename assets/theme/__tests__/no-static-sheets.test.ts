/**
 * No screen may import a module-level stylesheet from `assets/styles/timer-app`.
 *
 * Why a source scan instead of a render test: `StyleSheet.create` resolves ONCE at
 * import, so a static sheet is frozen to the DEFAULT accent forever. Nothing about
 * that is a type error and nothing about it fails at runtime — the screen simply
 * renders green while the rest of the app is blue. It shipped exactly that way: the
 * "Begin in countdown" picker on User Preferences, i.e. the very screen where the
 * accent is chosen, was the last call site importing `timerPickerModalStyles`
 * directly instead of taking it from `useAppStyles()`.
 *
 * A per-component render test would catch this one screen. This catches the class,
 * which is the point — a colour ROLE used at a call site is not asserted anywhere
 * else, so a revert or a copy-paste can silently un-theme a screen.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..", "..");

/** The module-level instances. Each has a `make*` factory that must be used instead. */
const STATIC_SHEETS = [
  "colorTheme",
  "designColors",
  "timerStyles",
  "pranayamaStyles",
  "hiitStyles",
  "screenStyles",
  "timerPickerModalStyles",
  "yogaTypography",
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === "__tests__" || entry.startsWith(".")) return [];
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });

/** Named imports pulled from the shared style modules, per file. */
const staticImportsIn = (file: string): string[] => {
  const src = readFileSync(file, "utf8");
  const hits: string[] = [];
  const re = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*"@\/assets\/(?:styles\/timer-app|theme\/typography)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (STATIC_SHEETS.includes(name)) hits.push(name);
    }
  }
  return hits;
};

describe("screens and components read styles from the hook, not the frozen sheet", () => {
  const files = [join(ROOT, "app"), join(ROOT, "components")].flatMap(walk);

  it("scans a non-trivial number of files", () => {
    // Guard the guard: a broken path would make every assertion below vacuous.
    expect(files.length).toBeGreaterThan(10);
  });

  it("imports no module-level stylesheet", () => {
    const offenders = Object.fromEntries(
      files
        .map((f) => [f.slice(ROOT.length + 1), staticImportsIn(f)] as const)
        .filter(([, names]) => names.length > 0),
    );
    // Names the file and the exact import, e.g.
    //   { "app/user-preferences.tsx": ["timerPickerModalStyles"] }
    expect(offenders).toEqual({});
  });
});
