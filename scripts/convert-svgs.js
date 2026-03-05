#!/usr/bin/env node
/**
 * convert-svgs.js — Convert traced SVGs to React Native components
 *
 * Reads traced.svg files from the svg-pipeline/poses/ directory and generates
 * React Native functional components using react-native-svg.
 *
 * CRITICAL: Preserves ALL nested <g> elements from the source SVG.
 * Rotated poses (from admin UI) have TWO <g> layers:
 *   outer: rotate(angle, cx, cy)
 *   inner: translate(0,H) scale(0.1,-0.1)
 * Non-rotated poses have ONE <g> layer:
 *   translate(0,H) scale(0.1,-0.1)
 * Dropping the inner translate+scale causes paths to render outside the viewBox.
 *
 * Usage:
 *   node scripts/convert-svgs.js                    # convert all poses
 *   node scripts/convert-svgs.js camel splits       # convert specific poses
 *   node scripts/convert-svgs.js --dry-run           # preview without writing
 *   node scripts/convert-svgs.js --register          # also update yoga-assets.ts
 */

const fs = require("fs");
const path = require("path");

// ── Configuration ──────────────────────────────────────────────────────────

const PIPELINE_DIR = path.resolve(__dirname, "../../svg-pipeline/poses");
const OUTPUT_DIR = path.resolve(__dirname, "../assets/images/svgx/yoga-poses");
const ASSETS_FILE = path.resolve(__dirname, "../assets/data/yoga-assets.ts");
const DEFAULT_FILL = "#81C784";

// ── Helpers ────────────────────────────────────────────────────────────────

function toPascalCase(kebab) {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/**
 * Parse all <g> elements from the SVG, preserving nesting order.
 * Returns an array of { transform, fill, stroke } objects, outermost first.
 */
function parseGElements(svgContent) {
  const gElements = [];
  // Match all opening <g ...> tags in order
  const gRegex = /<g\s+([^>]*)>/gi;
  let match;
  while ((match = gRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const transform = extractAttr(attrs, "transform");
    const fill = extractAttr(attrs, "fill");
    const stroke = extractAttr(attrs, "stroke");
    gElements.push({ transform, fill, stroke });
  }
  return gElements;
}

function extractAttr(attrString, name) {
  const regex = new RegExp(`${name}="([^"]*)"`, "i");
  const m = attrString.match(regex);
  return m ? m[1] : null;
}

function extractViewBox(svgContent) {
  const m = svgContent.match(/viewBox="([^"]*)"/i);
  return m ? m[1] : null;
}

/**
 * Extract all <path d="..."> data strings from the SVG.
 */
function extractPaths(svgContent) {
  const paths = [];
  const pathRegex = /<path\s+d="([^"]*)"[^/]*\/>/gi;
  let match;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

/**
 * Generate the React Native component source.
 */
function generateComponent(poseId, viewBox, gElements, paths) {
  const pascalName = toPascalCase(poseId) + "Svg";
  const fillExpr = `{props.color || "${DEFAULT_FILL}"}`;

  // Build nested G elements — the innermost gets fill + stroke
  let indent = "      ";
  let gOpen = "";
  let gClose = "";

  for (let i = 0; i < gElements.length; i++) {
    const g = gElements[i];
    const isInnermost = i === gElements.length - 1;

    if (isInnermost) {
      // Innermost G gets fill and stroke
      gOpen += `${indent}<G transform="${g.transform}" fill=${fillExpr} stroke="none">\n`;
    } else {
      // Outer G(s) get transform only — no fill/stroke
      gOpen += `${indent}<G transform="${g.transform}">\n`;
    }
    // Close tags in reverse order (built from outside in)
    gClose = `${indent}</G>\n` + gClose;
    indent += "  ";
  }

  // Build path elements
  const pathElements = paths
    .map((d) => `${indent}<Path d="${d}" />`)
    .join("\n");

  return `import * as React from "react";
import Svg, { G, Path, SvgProps } from "react-native-svg";

const ${pascalName} = (props: SvgProps) => {
  return (
    <Svg
      viewBox="${viewBox}"
      {...props}
    >
${gOpen}${pathElements}
${gClose}    </Svg>
  );
};

export { ${pascalName} };
`;
}

// ── Main ───────────────────────────────────────────────────────────────────

function convertPose(poseId, dryRun = false) {
  // Find the primary variant directory (first non-references subdirectory with traced.svg)
  const poseDir = path.join(PIPELINE_DIR, poseId);

  if (!fs.existsSync(poseDir)) {
    console.error(`  ✗ Pose directory not found: ${poseDir}`);
    return null;
  }

  // Look for traced.svg in variant subdirectories
  const subdirs = fs
    .readdirSync(poseDir)
    .filter((d) => {
      const fullPath = path.join(poseDir, d);
      return fs.statSync(fullPath).isDirectory() && d !== "references";
    });

  let tracedPath = null;
  let variantUsed = null;

  // Prefer "front" variant, then first found
  for (const variant of ["front", ...subdirs]) {
    const candidate = path.join(poseDir, variant, "traced.svg");
    if (fs.existsSync(candidate)) {
      tracedPath = candidate;
      variantUsed = variant;
      break;
    }
  }

  if (!tracedPath) {
    console.error(`  ✗ No traced.svg found for ${poseId}`);
    return null;
  }

  const svgContent = fs.readFileSync(tracedPath, "utf-8");
  const viewBox = extractViewBox(svgContent);
  const gElements = parseGElements(svgContent);
  const paths = extractPaths(svgContent);

  if (!viewBox) {
    console.error(`  ✗ No viewBox found in ${tracedPath}`);
    return null;
  }

  if (gElements.length === 0) {
    console.error(`  ✗ No <g> elements found in ${tracedPath}`);
    return null;
  }

  if (paths.length === 0) {
    console.error(`  ✗ No <path> elements found in ${tracedPath}`);
    return null;
  }

  // Filter out the metadata <g> (potrace metadata is not a real transform group)
  // Only keep <g> elements that have a transform attribute
  const transformGs = gElements.filter((g) => g.transform);

  if (transformGs.length === 0) {
    console.error(`  ✗ No <g> elements with transforms found in ${tracedPath}`);
    return null;
  }

  const gType =
    transformGs.length === 1
      ? "single G"
      : `nested G (${transformGs.length} layers)`;

  console.log(
    `  ✓ ${poseId} — variant: ${variantUsed}, ${paths.length} path(s), ${gType}`
  );

  // Log transforms for visibility
  transformGs.forEach((g, i) => {
    const label = transformGs.length > 1 ? (i === 0 ? "outer" : "inner") : "only";
    console.log(`    ${label}: ${g.transform}`);
  });

  const component = generateComponent(poseId, viewBox, transformGs, paths);
  const outputFile = path.join(OUTPUT_DIR, `${poseId}.tsx`);

  if (dryRun) {
    console.log(`    [dry-run] Would write: ${outputFile}`);
    return { poseId, pascalName: toPascalCase(poseId) + "Svg", outputFile };
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputFile, component, "utf-8");
  console.log(`    Wrote: ${outputFile}`);

  return { poseId, pascalName: toPascalCase(poseId) + "Svg", outputFile };
}

function updateAssetsRegistry(converted) {
  if (converted.length === 0) return;

  let content = fs.readFileSync(ASSETS_FILE, "utf-8");

  for (const { poseId, pascalName } of converted) {
    const importLine = `import { ${pascalName} } from "@/assets/images/svgx/yoga-poses/${poseId}";`;
    const entryBlock = `  "${poseId}": {\n    id: "${poseId}",\n    type: "svg",\n    asset: ${pascalName},\n  },`;

    // Skip if already imported
    if (content.includes(importLine)) {
      console.log(`  ⤳ ${poseId} already in registry, skipping`);
      continue;
    }

    // Add import after last existing yoga-poses import
    const lastImportIdx = content.lastIndexOf(
      'from "@/assets/images/svgx/yoga-poses/'
    );
    if (lastImportIdx !== -1) {
      const lineEnd = content.indexOf("\n", lastImportIdx);
      content =
        content.slice(0, lineEnd + 1) + importLine + "\n" + content.slice(lineEnd + 1);
    }

    // Add asset entry before the closing }; of YOGA_ASSETS
    const closingIdx = content.lastIndexOf("};");
    if (closingIdx !== -1) {
      content =
        content.slice(0, closingIdx) + entryBlock + "\n" + content.slice(closingIdx);
    }

    console.log(`  ✓ Registered ${poseId} in yoga-assets.ts`);
  }

  fs.writeFileSync(ASSETS_FILE, content, "utf-8");
}

// ── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const register = args.includes("--register");
const poseIds = args.filter((a) => !a.startsWith("--"));

// If no specific poses given, find all poses with traced.svg
let targets = poseIds;
if (targets.length === 0) {
  targets = fs
    .readdirSync(PIPELINE_DIR)
    .filter((d) => {
      const poseDir = path.join(PIPELINE_DIR, d);
      if (!fs.statSync(poseDir).isDirectory()) return false;
      // Check if any variant has traced.svg
      return fs.readdirSync(poseDir).some((sub) => {
        const subPath = path.join(poseDir, sub);
        return (
          fs.statSync(subPath).isDirectory() &&
          fs.existsSync(path.join(subPath, "traced.svg"))
        );
      });
    })
    .sort();
}

console.log(`\nConvert SVGs → React Native components`);
console.log(`Pipeline: ${PIPELINE_DIR}`);
console.log(`Output:   ${OUTPUT_DIR}`);
console.log(`Poses:    ${targets.length}${dryRun ? " (dry run)" : ""}\n`);

const results = [];
for (const poseId of targets) {
  const result = convertPose(poseId, dryRun);
  if (result) results.push(result);
}

if (register && !dryRun && results.length > 0) {
  console.log(`\nUpdating yoga-assets.ts registry...`);
  updateAssetsRegistry(results);
}

console.log(`\nDone. ${results.length}/${targets.length} converted.`);
if (!register && results.length > 0) {
  console.log(`Tip: Run with --register to also update yoga-assets.ts`);
}
