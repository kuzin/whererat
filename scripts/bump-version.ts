/**
 * Version bump script — updates versions.json and propagates to config files.
 *
 * Usage:
 *   tsx scripts/bump-version.ts <target> <bump>
 *
 * Targets:  web | api | ios | android
 * Bumps:    major | minor | patch | build   (build only valid for ios/android)
 *
 * Examples:
 *   tsx scripts/bump-version.ts web minor
 *   tsx scripts/bump-version.ts api patch
 *   tsx scripts/bump-version.ts ios patch
 *   tsx scripts/bump-version.ts ios build
 *   tsx scripts/bump-version.ts android minor
 *   tsx scripts/bump-version.ts android build
 */

import fs from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");

type Target = "web" | "api" | "ios" | "android";
type Bump = "major" | "minor" | "patch" | "build";

interface Versions {
  web: string;
  api: string;
  ios: string;
  iosBuild: string;
  android: string;
  androidBuild: number;
}

function bumpSemver(version: string, bump: "major" | "minor" | "patch"): string {
  const parts = version.split(".").map(Number);
  const [major, minor, patch] = parts;
  switch (bump) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function main(): void {
  const [target, bump] = process.argv.slice(2) as [Target, Bump];

  if (!target || !bump) {
    console.error("Usage: tsx scripts/bump-version.ts <web|api|ios|android> <major|minor|patch|build>");
    process.exit(1);
  }
  if (!["web", "api", "ios", "android"].includes(target)) {
    console.error(`Unknown target: ${target}. Expected: web | api | ios | android`);
    process.exit(1);
  }
  if (!["major", "minor", "patch", "build"].includes(bump)) {
    console.error(`Unknown bump: ${bump}. Expected: major | minor | patch | build`);
    process.exit(1);
  }
  if (bump === "build" && target !== "ios" && target !== "android") {
    console.error(`'build' bump is only valid for ios or android targets`);
    process.exit(1);
  }

  const versionsPath = path.join(ROOT, "versions.json");
  const versions = readJson<Versions>(versionsPath);
  const prev = { ...versions };

  // ── Bump versions.json ──────────────────────────────────────────────────────

  if (bump === "build") {
    if (target === "ios") {
      versions.iosBuild = String(Number(versions.iosBuild) + 1);
    } else {
      versions.androidBuild = versions.androidBuild + 1;
    }
  } else {
    if (target === "ios" || target === "android") {
      versions[target] = bumpSemver(versions[target], bump);
      // Reset build number when semver is bumped
      if (target === "ios") versions.iosBuild = "1";
      if (target === "android") versions.androidBuild = 1;
    } else {
      versions[target] = bumpSemver(versions[target], bump);
    }
  }

  writeJson(versionsPath, versions);
  console.log(`✓ versions.json`);

  // ── Propagate to package.json (web) ─────────────────────────────────────────

  if (target === "web") {
    const pkgPath = path.join(ROOT, "package.json");
    const pkg = readJson<Record<string, unknown>>(pkgPath);
    pkg.version = versions.web;
    writeJson(pkgPath, pkg);
    console.log(`✓ package.json`);
  }

  // ── Propagate to apps/mobile/app.json (ios / android) ──────────────────────

  if (target === "ios" || target === "android") {
    const appJsonPath = path.join(ROOT, "apps/mobile/app.json");
    const appJson = readJson<{
      expo: {
        version: string;
        ios: { buildNumber?: string; infoPlist?: Record<string, string> };
        android: { versionCode?: number };
      };
    }>(appJsonPath);

    if (target === "ios") {
      // iOS version string lives in infoPlist to allow independent semver from Android
      if (!appJson.expo.ios.infoPlist) appJson.expo.ios.infoPlist = {};
      appJson.expo.ios.infoPlist.CFBundleShortVersionString = versions.ios;
      appJson.expo.ios.buildNumber = versions.iosBuild;
    } else {
      // expo.version is Android's versionName
      appJson.expo.version = versions.android;
      appJson.expo.android.versionCode = versions.androidBuild;
    }

    writeJson(appJsonPath, appJson);
    console.log(`✓ apps/mobile/app.json`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log();
  if (bump === "build") {
    const buildKey = target === "ios" ? "iosBuild" : "androidBuild";
    console.log(`${target} build: ${prev[buildKey]} → ${versions[buildKey]}`);
  } else {
    console.log(`${target}: ${prev[target]} → ${versions[target]}`);
    if (target === "ios") console.log(`  iosBuild reset to ${versions.iosBuild}`);
    if (target === "android") console.log(`  androidBuild reset to ${versions.androidBuild}`);
  }
}

main();
