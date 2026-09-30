// Usage: node scripts/update-workspace-version.js <semver> [--skip-install]
import {
  getRepoRoot,
  getWorkspaceInfo,
  validateSemverVersion,
  updateWorkspacePackageJsonFiles,
  runYarnInstall,
} from "./workspace-versions.js";

async function main() {
  const args = process.argv.slice(2);
  const skipInstall = args.includes("--skip-install");
  const positional = args.filter((a) => a !== "--skip-install");
  const version = positional[0];

  if (!version) {
    console.error(
      "Usage: node scripts/update-workspace-version.js <semver> [--skip-install]"
    );
    process.exit(1);
  }

  const rootDir = getRepoRoot();

  try {
    await validateSemverVersion(version);
    const workspaceInfo = await getWorkspaceInfo(rootDir);
    await updateWorkspacePackageJsonFiles(version, workspaceInfo, rootDir);
    if (!skipInstall) {
      runYarnInstall(rootDir);
    }
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}

main();
