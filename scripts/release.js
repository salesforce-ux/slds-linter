import { Listr } from "listr2";
import input from "@inquirer/input";
import select from "@inquirer/select";
import { ListrInquirerPromptAdapter } from "@listr2/prompt-adapter-inquirer";
import { execSync, exec } from "child_process";
import path from "path";
import chalk from "chalk";
import { generateReleaseNotes } from "./generate-release-notes.js";
import { verifyTarballs } from "./verify-tarballs.js";
import {
  getRepoRoot,
  getWorkspaceInfo,
  validateSemverVersion,
  syncWorkspaceVersion,
} from "./workspace-versions.js";

const ROOT_DIR = getRepoRoot();
const isDryRun = process.argv.includes("--dry-run") || false; // Skips publishing npm, git operations
const skipCheck = process.argv.includes("--skip-check") || false; // Skips checking working directory git status
const skipNpmPublish = process.argv.includes("--skip-npm-publish") || false; // Skips npm publish

async function checkExistingTag(version, targetPersona) {
  const remote = targetPersona === "external" ? "origin" : "internal";
  try {
    return execSync(`git tag -l "${version}" ${remote}`, { stdio: "pipe" })
      .toString()
      .trim();
  } catch (error) {
    return false;
  }
}

async function incrementPreReleaseVersion(baseVersion, type, targetPersona) {
  let version = baseVersion;
  let increment = 0;
  

  while (await checkExistingTag(`${version}-${type}.${increment}`, targetPersona)) {
    increment++;
  }

  return `${version}-${type}.${increment}`;
}

async function gitOperations(version, targetPersona) {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();
  const releaseBranch = `release/${targetPersona}/${version}`;
  const remote = targetPersona === "external" ? "origin" : "internal";

  execSync(`git checkout -b ${releaseBranch}`);
  execSync("git add .");
  execSync(`git commit -m "chore: release ${version}"`);
  execSync(`git push ${remote} ${releaseBranch}`);
  
  return {
    currentBranch,
    releaseBranch
  }
}

async function createPR(version, { currentBranch, releaseBranch, targetPersona }) {

  if(targetPersona !== "external") {
    console.log(chalk.yellow("Skipping PR creation for internal release"));
    return;
  }

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

async function publishPackages(tarballs, version, releaseType, targetPersona) {
  const tag = releaseType === "final" ? "latest" : releaseType;
  // all internal packages are published to the internal tag
  let personaTag;
  if (targetPersona === "external") {
    personaTag = tag;
  } else {
    personaTag = `internal${tag==="latest" ? "" : `-${tag}`}`;
  }

  for (const { pkgName, tarball, pkgPath } of tarballs) {
    execSync(
      `cd ${pkgPath} && NPM_TOKEN=${process.env.NPM_TOKEN} npm publish --tag ${personaTag} --access public ${isDryRun || skipNpmPublish ? "--dry-run" : ""}`
    );
    console.log(chalk.green(`Published ${pkgName}@${version}`));
  }
}

async function createTag(version, targetPersona) {
  // skip if tag already exists
  const remote = targetPersona === "external" ? "origin" : "internal";
  if(checkExistingTag(version, targetPersona)) {
    console.log(chalk.yellow(`Tag ${version} on ${remote} already exists, skipping tag creation`));
    return;
  }
  execSync(`git tag ${version} && git push ${remote} ${version}`);
  console.log(chalk.green(`Created tag: ${version} on ${remote}`));
}

async function createGitHubRelease({ finalVersion, sldsLinterTarball, releaseType, targetPersona }) {
  const isExternal = targetPersona === "external";
  const remote = isExternal ? "origin" : "internal";
  if (releaseType !== "final" && isExternal) {
    console.log(chalk.yellow("Skipping GitHub release for pre-release external release"));
    return;
  }

  const previousVersion = execSync(`git describe --tags --abbrev=0 ${remote}`)
    .toString()
    .trim();
  const releaseNotes = await generateReleaseNotes(finalVersion, previousVersion);
  const releaseSuffix = releaseType !== "final" ? " --prerelease" : "";
  execSync(
    `gh release create ${finalVersion} ${sldsLinterTarball} --title "${finalVersion}" --notes "${releaseNotes}"${releaseSuffix}`
  );
  console.log(chalk.green(`Created GitHub release: ${finalVersion}`));
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
          title:"Prompt for target persona",
          task: async (ctx, task) => {
            const prompt = task.prompt(ListrInquirerPromptAdapter);
            const targetPersona = await prompt.run(select, {
              message: "Select target persona:",
              choices: [
                { name: "Internal", value: "internal" },
                { name: "External", value: "external" }
              ],
              default: "internal",
            });

            if (!targetPersona) {
              throw new Error("Input valid target persona. Skipping release.");
            }
            ctx.targetPersona = targetPersona;
          },
        },
        {
          title: "Prompt for version and release type",
          task: async (ctx, task) => {
            const prompt = task.prompt(ListrInquirerPromptAdapter);
            const version = await prompt.run(input, {
              message: "Enter the version number (e.g., 1.0.0):",
              validate: validateSemverVersion,
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
            // Internal releases get -internal suffix to avoid version conflicts with external releases
            const suffix = ctx.targetPersona === "external" ? "" : `-${ctx.targetPersona}`;
            const version = ctx.version + suffix;
            ctx.finalVersion = version;
            if (ctx.releaseType !== "final") {
              ctx.finalVersion = await incrementPreReleaseVersion(
                version,
                ctx.releaseType,
                ctx.targetPersona
              );
            }
          },
        },
        {
          title: "Update all package versions",
          task: async (ctx) => {
            await syncWorkspaceVersion(
              ctx.finalVersion,
              ctx.workspaceInfo,
              ROOT_DIR
            );
          },
        },
        {
          title: "Git operations",
          skip: () => isDryRun,
          task: async (ctx) => {
            const { currentBranch, releaseBranch } = await gitOperations(ctx.finalVersion, ctx.targetPersona);
            ctx.currentBranch = currentBranch;
            ctx.releaseBranch = releaseBranch;
          },
        },
        {
          title: "Building workspace",
          task: async (ctx) => {
            const envVar = ["CLI_BUILD_MODE=release"];
            // CA distribution is treated as external for build purposes
            if(ctx.targetPersona !== "external") {
              envVar.push(`TARGET_PERSONA=${ctx.targetPersona}`);
            }           
            execSync(`${envVar.join(" ")} yarn build`, {
              stdio: 'inherit'
            });
          },
        },
        {
          title: "Generate tarballs",
          task: async (ctx) => {
            ctx.tarballs = await generateTarballs(ctx.workspaceInfo);
            ctx.sldsLinterTarball = ctx.tarballs.find(tarball => tarball.pkgName === "@salesforce-ux/slds-linter").tarball;
          },
        },
        {
          title: "Verify tarballs",
          task: async (ctx) => {
            await verifyTarballs(ctx.tarballs, ctx.finalVersion);
          },
        },
        {
          title: "Publish packages",
          skip: (ctx) => ctx.targetPersona !== "external",
          task: async (ctx) => {
            await publishPackages(
              ctx.tarballs,
              ctx.finalVersion,
              ctx.releaseType,
              ctx.targetPersona
            );
          },
        },
        {
          title: "Create PR",
          skip: (ctx) => isDryRun || ctx.targetPersona !== "external",
          task: async (ctx) => {
            await createPR(ctx.finalVersion, ctx);
          },
        },
        {
          title: "Create tag",
          skip: () => isDryRun || ctx.targetPersona !== "external",
          task: async (ctx) => {
            await createTag(ctx.finalVersion, ctx.targetPersona);
          },
        },
        {
          title: "Create GitHub release",
          skip: (ctx) => isDryRun || ctx.releaseType !== "final" || !ctx.sldsLinterTarball || ctx.targetPersona !== "external",
          task: async (ctx) => {
            await createGitHubRelease(ctx);
          },
        },
        {
          title: "Comment on included PRs",
          skip: () => isDryRun || ctx.targetPersona !== "external",
          task: async () => {
            return exec("node scripts/comment-release-prs.js");
          },
        },
        {
          title: "Perform post-release checks",
          skip: () => skipCheck || ctx.targetPersona !== "external",
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
