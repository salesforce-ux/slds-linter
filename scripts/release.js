import { Listr } from "listr2";
import input from "@inquirer/input";
import select from "@inquirer/select";
import { ListrInquirerPromptAdapter } from "@listr2/prompt-adapter-inquirer";
import { execSync, exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import semver from "semver";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { generateReleaseNotes } from "./generate-release-notes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const isDryRun = process.argv.includes("--dry-run") || false; // Skips publishing npm, git operations
const skipCheck = process.argv.includes("--skip-check") || false; // Skips checking working directory git status

async function getWorkspaceInfo() {
  try {
    const output = execSync("yarn workspaces info --json").toString();
    const matches = output
      .trim()
      .replace(/\n/g, "")
      .match(/\{(.*)\}/);
    if (!matches || !matches.length) {
      throw new Error(output);
    }
    return JSON.parse(matches[0]);
  } catch (error) {
    throw new Error(`Failed to parse workspace info: ${error.message}`);
  }
}

async function validateVersion(version) {
  if (!semver.valid(version)) {
    throw new Error(
      "Invalid version format. Please use semver format (e.g., 1.0.0)"
    );
  }
  return true;
}

async function checkExistingTag(version) {
  try {
    return execSync(`git tag -l "${version}"`, { stdio: "pipe" })
      .toString()
      .trim();
  } catch (error) {
    return false;
  }
}

async function incrementPreReleaseVersion(baseVersion, type) {
  let version = baseVersion;
  let increment = 0;

  while (await checkExistingTag(`${version}-${type}.${increment}`)) {
    increment++;
  }

  return `${version}-${type}.${increment}`;
}

async function updatePackageVersions(version, workspaceInfo) {
  for (const [pkgName, info] of Object.entries(workspaceInfo)) {
    const pkgPath = path.join(ROOT_DIR, info.location, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));

    // Update package version
    pkg.version = version;

    // Update workspace dependencies
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

async function gitOperations(version) {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();
  const releaseBranch = `release/${version}`;

  execSync(`git checkout -b ${releaseBranch}`);
  execSync("git add .");
  execSync(`git commit -m "Release ${version}"`);
  execSync(`git push origin ${releaseBranch}`);

  // Create PR from release branch to current branch
  const prUrl = execSync(
    `gh pr create --base ${currentBranch} --head ${releaseBranch} --title "Release ${version}" --body "Automated release PR"`
  )
    .toString()
    .trim();
  console.log(chalk.green(`Created PR: ${prUrl}`));

  // Auto-merge the PR
  execSync(`gh pr merge ${prUrl} --merge --delete-branch`);
  console.log(chalk.green(`Merged PR: ${prUrl}`));

  // Switch back to the current branch
  execSync(`git checkout ${currentBranch}`);

  // Create and push tag
  execSync(`git tag ${version}`);
  execSync(`git push origin ${version}`);
}

async function publishPackages(workspaceInfo, version, releaseType) {
  const tag = releaseType === "final" ? "latest" : releaseType;
  let sldsLinterTarball = "";

  for (const [pkgName, info] of Object.entries(workspaceInfo)) {
    const pkgPath = path.join(ROOT_DIR, info.location);
    if (pkgName.match(/slds-linter/)) {
      // Generate tarball for slds-linter
      sldsLinterTarball = execSync(`cd ${pkgPath} && npm pack`)
        .toString()
        .trim();
      console.log(chalk.blue(`Generated tarball: ${sldsLinterTarball}`));
      sldsLinterTarball = path.join(pkgPath, sldsLinterTarball);
    }
    execSync(
      `cd ${pkgPath} && NPM_TOKEN=${process.env.NPM_TOKEN} npm publish --tag ${tag} --access public ${isDryRun ? "--dry-run" : ""}`
    );
    console.log(chalk.green(`Published ${pkgName}@${version}`));
  }

  return sldsLinterTarball;
}

async function createGitHubRelease(version, tarballPath, releaseType) {
  const previousVersion = execSync("git describe --tags --abbrev=0")
    .toString()
    .trim();
  const releaseNotes = await generateReleaseNotes(version, previousVersion);
  const releaseSuffix = releaseType !== "final" ? " --prerelease" : "";
  execSync(
    `gh release create ${version} ${tarballPath} --title "${version}" --notes "${releaseNotes}"${releaseSuffix}`
  );
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
          title: "Prompt for version and release type",
          task: async (ctx, task) => {
            const prompt = task.prompt(ListrInquirerPromptAdapter);
            const version = await prompt.run(input, {
              message: "Enter the version number (e.g., 1.0.0):",
              validate: validateVersion,
              required: true,
            });

            if (!version) {
              throw new Error("Input valid version. Skipping release.");
            }

            const releaseType = await prompt.run(select, {
              message: "Select release type:",
              choices: [
                { name: "Final", value: "final" },
                { name: "Alpha", value: "alpha" },
                { name: "Beta", value: "beta" },
              ],
              default: "final",
            });

            if (!releaseType) {
              throw new Error("Input valid release type. Skipping release.");
            }

            ctx.version = version;
            ctx.releaseType = releaseType;
          },
        },
        {
          title: "Handle version generation",
          task: async (ctx) => {
            ctx.finalVersion = ctx.version;
            if (ctx.releaseType !== "final") {
              ctx.finalVersion = await incrementPreReleaseVersion(
                ctx.version,
                ctx.releaseType
              );
            }
          },
        },
        {
          title: "Update all package versions",
          task: async (ctx) => {
            await updatePackageVersions(ctx.finalVersion, ctx.workspaceInfo);
          },
        },
        {
          title: "Git operations",
          skip: () => isDryRun,
          task: async (ctx) => {
            await gitOperations(ctx.finalVersion);
          },
        },
        {
          title: "Building workspace",
          task: async () => {
            return exec("CLI_BUILD_MODE=release yarn build");
          },
        },
        {
          title: "Publish packages",
          task: async (ctx) => {
            ctx.sldsLinterTarball = await publishPackages(
              ctx.workspaceInfo,
              ctx.finalVersion,
              ctx.releaseType
            );
          },
        },
        {
          title: "Create GitHub release",
          skip: () => isDryRun || !ctx.sldsLinterTarball,
          task: async (ctx) => {
            await createGitHubRelease(
              ctx.finalVersion,
              ctx.sldsLinterTarball,
              ctx.releaseType
            );
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
