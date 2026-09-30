import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import semver from "semver";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getRepoRoot() {
  return path.resolve(__dirname, "..");
}

export async function getWorkspaceInfo(rootDir = getRepoRoot()) {
  try {
    const output = execSync("yarn workspaces list --json", {
      cwd: rootDir,
      encoding: "utf8",
    });
    const workspacesArray = output
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => JSON.parse(line));

    return workspacesArray.reduce((acc, workspace) => {
      acc[workspace.name] = {
        location: workspace.location,
        workspaceDependencies: [],
        mismatchedWorkspaceDependencies: [],
      };
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Failed to parse workspace info: ${error.message}`);
  }
}

export async function validateSemverVersion(version) {
  if (!semver.valid(version)) {
    throw new Error(
      "Invalid version format. Please use semver format (e.g., 1.0.0)"
    );
  }
  return true;
}

export async function updateWorkspacePackageJsonFiles(
  version,
  workspaceInfo,
  rootDir = getRepoRoot()
) {
  for (const info of Object.values(workspaceInfo)) {
    const pkgPath = path.join(rootDir, info.location, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));

    pkg.version = version;

    for (const dep of ["dependencies", "devDependencies", "peerDependencies"]) {
      if (!pkg[dep]) continue;

      for (const [depName, depVersion] of Object.entries(pkg[dep])) {
        if (workspaceInfo[depName]) {
          pkg[dep][depName] = version;
        }
      }
    }

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }
}

export function runYarnInstall(rootDir = getRepoRoot(), stdio = "inherit") {
  execSync("yarn install", { cwd: rootDir, stdio });
}

export async function syncWorkspaceVersion(
  version,
  workspaceInfo,
  rootDir = getRepoRoot()
) {
  await updateWorkspacePackageJsonFiles(version, workspaceInfo, rootDir);
  runYarnInstall(rootDir);
}
