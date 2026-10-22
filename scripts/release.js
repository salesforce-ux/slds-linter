import { Listr } from "listr2";
import { execSync, execFileSync, exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import semver from "semver";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { generateReleaseNotes } from "./generate-release-notes.js";
import { verifyTarballs } from "./verify-tarballs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const RELEASE_VERSIONS_FILE = path.join(ROOT_DIR, "release-versions.json");
const CLI_PACKAGE = "@salesforce-ux/slds-linter";
const isDryRun = process.argv.includes("--dry-run") || false; // Skips publishing npm, git operations
const skipCheck = process.argv.includes("--skip-check") || false; // Skips checking working directory git status
const skipNpmPublish = process.argv.includes("--skip-npm-publish") || false; // Skips npm publish

async function getWorkspaceInfo() {
  try {
    const output = execSync("yarn workspaces list --json").toString();
    // Convert array-style output from workspaces list to object-style output like workspaces info
    const workspacesArray = output.trim().split('\n').slice(1).map(line => JSON.parse(line));
    
    // Format as an object that matches the original format expected by the rest of the script
    return workspacesArray.reduce((acc, workspace) => {
      acc[workspace.name] = {
        location: workspace.location,
        workspaceDependencies: [],
        mismatchedWorkspaceDependencies: []
      };
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Failed to parse workspace info: ${error.message}`);
  }
}

// Reads the fixed { version, tag } for every workspace package from release-versions.json
async function loadReleaseVersions(workspaceInfo) {
  let config;
  try {
    config = JSON.parse(await fs.readFile(RELEASE_VERSIONS_FILE, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read ${path.basename(RELEASE_VERSIONS_FILE)}: ${error.message}`);
  }

  const releases = config.packages || {};
  for (const pkgName of Object.keys(workspaceInfo)) {
    const release = releases[pkgName];
    if (!release) {
      throw new Error(`Missing release entry for ${pkgName} in release-versions.json`);
    }
    if (!semver.valid(release.version)) {
      throw new Error(`Invalid version "${release.version}" for ${pkgName}. Please use semver format (e.g., 1.0.0)`);
    }
    if (typeof release.tag !== "string" || !release.tag.trim()) {
      throw new Error(`Missing npm tag for ${pkgName} in release-versions.json`);
    }
  }
  if (!releases[CLI_PACKAGE]) {
    throw new Error(`Missing release entry for ${CLI_PACKAGE} in release-versions.json`);
  }

  return releases;
}

async function updatePackageVersions(releases, workspaceInfo) {
  for (const [pkgName, info] of Object.entries(workspaceInfo)) {
    const pkgPath = path.join(ROOT_DIR, info.location, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));

    // Update package version
    pkg.version = releases[pkgName].version;

    // Pin workspace dependencies to their release versions
    for (const dep of ["dependencies", "devDependencies", "peerDependencies"]) {
      if (!pkg[dep]) continue;

      for (const depName of Object.keys(pkg[dep])) {
        if (workspaceInfo[depName]) {
          pkg[dep][depName] = releases[depName].version;
        }
      }
    }

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }
  // Install dependencies to update the yarn.lock file
  execSync(`yarn install`, {
    stdio: 'inherit'
  });
}

async function gitOperations(version) {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();
  const releaseBranch = `release/${version}`;

  execSync(`git checkout -b ${releaseBranch}`);
  execSync("git add .");
  execSync(`git commit -m "Release ${version}"`);
  execSync(`git push origin ${releaseBranch}`);
  
  return {
    currentBranch,
    releaseBranch
  }
}

async function createPR(version, { currentBranch, releaseBranch }) {
  // Create PR from release branch to current branch
  execSync(`git stash`);

  const prUrl = execSync(
    `gh pr create --base ${currentBranch} --head ${releaseBranch} --title "Release ${version}" --body "Automated release PR"`
  )
    .toString()
    .trim();
  console.log(chalk.green(`Created PR: ${prUrl}`));

  execSync(`gh pr merge ${prUrl} --merge --delete-branch`);
  console.log(chalk.green(`Merged PR: ${prUrl}`));

  execSync(`git checkout ${currentBranch} && git stash pop`);
}

async function generateTarballs(workspaceInfo) {
  const tarballs = [];
  for (const [pkgName, info] of Object.entries(workspaceInfo)) {
    const pkgPath = path.join(ROOT_DIR, info.location);
    const tarball = execSync(`cd ${pkgPath} && npm pack`)
        .toString()
        .trim();
    console.log(chalk.blue(`Generated tarball: ${tarball}`));
    tarballs.push({
      pkgName,
      tarball: path.join(pkgPath, tarball),
      pkgPath
    });
  }
  return tarballs;
}

async function publishPackages(tarballs, releases) {
  let sldsLinterTarball = "";

  for (const { pkgName, tarball, pkgPath } of tarballs) {
    const { version, tag } = releases[pkgName];
    if (pkgName === CLI_PACKAGE) {
      sldsLinterTarball = tarball;
      console.log(chalk.blue(`Using pre-generated tarball: ${sldsLinterTarball}`));
    }
    // Args array (no shell) so values from release-versions.json can't inject commands
    const publishArgs = ["publish", "--tag", tag, "--access", "public"];
    if (isDryRun || skipNpmPublish) publishArgs.push("--dry-run");
    execFileSync("npm", publishArgs, { cwd: pkgPath, stdio: "pipe" });
    const action = isDryRun || skipNpmPublish ? "Dry-run published" : "Published";
    console.log(chalk.green(`${action} ${pkgName}@${version} (tag: ${tag})`));
  }

  return sldsLinterTarball;
}

async function createTag(version) {
  // skip if tag already exists
  if (execSync(`git tag -l "${version}"`, { stdio: "pipe" }).toString().trim()) {
    console.log(chalk.yellow(`Tag ${version} already exists, skipping tag creation`));
    return;
  }
  execSync(`git tag ${version} && git push origin ${version}`);
  console.log(chalk.green(`Created tag: ${version}`));
}

async function createGitHubRelease(version, tarballPath) {

  if (semver.prerelease(version)) {
    console.log(chalk.yellow("Skipping GitHub release for pre-release"));
    return;
  }

  const previousVersion = execSync("git describe --tags --abbrev=0")
    .toString()
    .trim();
  const releaseNotes = await generateReleaseNotes(version, previousVersion);
  execFileSync("gh", [
    "release", "create", version, tarballPath,
    "--title", version,
    "--notes", releaseNotes,
  ]);
  console.log(chalk.green(`Created GitHub release: ${version}`));
}

async function checkWorkingDirectory() {
  try {
    // Check if the working directory is clean
    execSync("git diff --quiet HEAD");

    // Check if the local branch is up to date with the remote
    execSync("git fetch");
    const localCommit = execSync("git rev-parse HEAD").toString().trim();
    const remoteCommit = execSync("git rev-parse @{u}").toString().trim();
    if (localCommit !== remoteCommit) {
      throw new Error("Local branch is not up to date with remote");
    }

    // Check for staged/unstaged changes
    const status = execSync("git status --porcelain").toString();
    if (status.length > 0) {
      throw new Error("There are staged or unstaged changes");
    }

    // Check if gh is installed and authenticated
    execSync("gh --version");
    execSync("gh auth status");

    console.log(chalk.green("Pre-release checks passed successfully."));
  } catch (error) {
    throw new Error(`Pre-release check failed: ${error.message}`);
  }
}

async function resetWorkingDirectory() {
  try {
    // Reset the working directory with orign
    execSync("git reset --hard");
    console.log(chalk.green("Post-release checks passed successfully."));
  } catch (error) {
    throw new Error(`Post-release check failed: ${error.message}`);
  }
}

async function main() {
  try {
    const ctx = {};

    const tasks = new Listr(
      [
        {
          title: "Perform pre-release checks",
          skip: () => skipCheck,
          task: async () => {
            await checkWorkingDirectory();
          },
        },
        {
          title: "Get workspace information",
          task: async (ctx) => {
            ctx.workspaceInfo = await getWorkspaceInfo();
          },
        },
        {
          title: "Read release versions",
          task: async (ctx, task) => {
            ctx.releases = await loadReleaseVersions(ctx.workspaceInfo);
            // The CLI version identifies the release (branch, git tag, GitHub release)
            ctx.finalVersion = ctx.releases[CLI_PACKAGE].version;
            task.output = Object.keys(ctx.workspaceInfo)
              .map((pkgName) => `${pkgName}@${ctx.releases[pkgName].version} (tag: ${ctx.releases[pkgName].tag})`)
              .join("\n");
          },
          rendererOptions: { persistentOutput: true },
        },
        {
          title: "Update all package versions",
          task: async (ctx) => {
            await updatePackageVersions(ctx.releases, ctx.workspaceInfo);
          },
        },
        {
          title: "Git operations",
          skip: () => isDryRun,
          task: async (ctx) => {
            const { currentBranch, releaseBranch } = await gitOperations(ctx.finalVersion);
            ctx.currentBranch = currentBranch;
            ctx.releaseBranch = releaseBranch;
          },
        },
        {
          title: "Building workspace",
          task: async () => {
            execSync("CLI_BUILD_MODE=release yarn build", {
              stdio: 'inherit'
            });
          },
        },
        {
          title: "Generate tarballs",
          task: async (ctx) => {
            ctx.tarballs = await generateTarballs(ctx.workspaceInfo);
          },
        },
        {
          title: "Verify tarballs",
          task: async (ctx) => {
            const expectedVersions = Object.fromEntries(
              Object.entries(ctx.releases).map(([pkgName, { version }]) => [pkgName, version])
            );
            await verifyTarballs(ctx.tarballs, expectedVersions);
          },
        },
        {
          title: "Publish packages",
          task: async (ctx) => {
            ctx.sldsLinterTarball = await publishPackages(ctx.tarballs, ctx.releases);
          },
        },
        {
          title: "Create PR",
          skip: (ctx) => isDryRun || !ctx.sldsLinterTarball,
          task: async (ctx) => {
            await createPR(ctx.finalVersion, ctx);
          },
        },
        {
          title: "Create tag",
          skip: () => isDryRun || !ctx.sldsLinterTarball,
          task: async (ctx) => {
            await createTag(ctx.finalVersion);
          },
        },
        {
          title: "Create GitHub release",
          skip: (ctx) => isDryRun || !!semver.prerelease(ctx.finalVersion) || !ctx.sldsLinterTarball,
          task: async (ctx) => {
            await createGitHubRelease(ctx.finalVersion, ctx.sldsLinterTarball);
          },
        },
        {
          title: "Comment on included PRs",
          skip: () => isDryRun,
          task: async () => {
            return exec("node scripts/comment-release-prs.js");
          },
        },
        {
          title: "Perform post-release checks",
          skip: () => skipCheck,
          task: async () => {
            await resetWorkingDirectory();
          },
        },
      ],
      { concurrent: false }
    );

    await tasks.run(ctx);

    console.log(
      chalk.green(`\nRelease ${ctx.finalVersion} completed successfully!`)
    );
  } catch (error) {
    console.error(chalk.red("Error:"), chalk.red(error.message));
    process.exit(1);
  }
}

main();
