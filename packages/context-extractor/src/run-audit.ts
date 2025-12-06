import path from "path";
import { promises as fs } from "fs";
import { auditBundle } from "./services/context-audit";
import type { ComponentBundle } from "./types";

async function main() {
  const [, , indexArg] = process.argv;

  const rootDir = "../../../core-public/core";
  let index = Number(indexArg);

  if (Number.isNaN(index)) {
    index = 0;
  }

  const bundlesPath = path.resolve(process.cwd(), "bundles.json");
  let raw: string;
  try {
    raw = await fs.readFile(bundlesPath, "utf8");
  } catch (e) {
    console.error(`bundles.json not found at ${bundlesPath}`);
    process.exit(1);
  }

  const data: Record<string, ComponentBundle[]> = JSON.parse(raw);
  const flat: ComponentBundle[] = [];

  for (const moduleName of Object.keys(data)) {
    for (const bundle of data[moduleName]) {
      flat.push(bundle);
    }
  }

  if (flat.length === 0) {
    console.error("No bundles found in bundles.json");
    process.exit(1);
  }

  const idx = ((index % flat.length) + flat.length) % flat.length;
  const bundle = flat[idx];

  const issues = await auditBundle({ rootDir, bundle });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(issues, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
