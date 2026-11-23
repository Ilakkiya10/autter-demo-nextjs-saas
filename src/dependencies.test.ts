import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

type LockEntry = { version?: string };
type Lockfile = { packages: Record<string, LockEntry> };

const lockfile = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../package-lock.json", import.meta.url)),
    "utf8",
  ),
) as Lockfile;

function compareVersions(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const patchedVersions: Record<string, string> = {
  next: "15.5.28",
  tinypool: "2.1.2",
  postcss: "8.5.18",
  sharp: "0.35.5",
  "source-map-js": "1.2.2",
  vite: "7.3.7",
  zod: "4.6.6",
};

describe("dependency security pins", () => {
  for (const [name, minimum] of Object.entries(patchedVersions)) {
    test(`${name} is locked to a patched version`, () => {
      const entry = lockfile.packages[`node_modules/${name}`];
      expect(entry?.version, `missing lock entry for ${name}`).toBeDefined();
      expect(
        compareVersions(entry.version as string, minimum),
      ).toBeGreaterThanOrEqual(0);
    });
  }

  test("every locked postcss copy includes the traversal fixes", () => {
    const copies = Object.entries(lockfile.packages).filter(
      ([key]) =>
        key === "node_modules/postcss" ||
        key.endsWith("/node_modules/postcss"),
    );
    expect(copies.length).toBeGreaterThan(0);
    for (const [key, entry] of copies) {
      expect(
        compareVersions(entry.version as string, "8.5.18"),
        `${key}@${entry.version}`,
      ).toBeGreaterThanOrEqual(0);
    }
  });
});
