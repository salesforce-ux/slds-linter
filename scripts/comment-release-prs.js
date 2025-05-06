import { execSync } from "child_process";
import chalk from "chalk";

async function getLatestReleases() {
  try {
    const releases = execSync("gh release list --limit 2")
      .toString()
      .trim()
      .split("\n");
    
    if (releases.length < 2) {
      throw new Error("Need at least 2 releases to compare");
    }

    const [currentRelease, previousRelease] = releases.map(line => {
      const [tag] = line.split("\t");
      return tag;
    });

    return { currentRelease, previousRelease };
  } catch (error) {
    throw new Error(`Failed to get releases: ${error.message}`);
  }
}

async function getCommitsBetweenReleases(currentRelease, previousRelease) {
  try {
    const commits = execSync(`git log ${previousRelease}..${currentRelease} --pretty=format:"%H"`)
      .toString()
      .trim()
      .split("\n");
    return commits;
  } catch (error) {
    throw new Error(`Failed to get commits: ${error.message}`);
  }
}

async function getPRsFromCommits(commits) {
  const prSet = new Set();
  
  for (const commit of commits) {
    try {
      console.log(chalk.blue(`Checking commit: ${commit}`));
      
      // Use GitHub API to find PRs associated with this commit
      const prInfo = execSync(`gh api /repos/salesforce-ux/slds-linter/commits/${commit}/pulls`)
        .toString()
        .trim();
      
      if (prInfo) {
        const prList = JSON.parse(prInfo);
        prList.forEach(pr => {
          console.log(chalk.blue(`Found PR #${pr.number} for commit ${commit}`));
          prSet.add(pr.number);
        });
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not find PR for commit ${commit}: ${error.message}`));
    }
  }
  
  return Array.from(prSet);
}

async function ensureLabelsExist(labels) {
  for (const label of labels) {
    try {
      // Check if label exists
      execSync(`gh label view "${label}"`, { stdio: 'ignore' });
    } catch (error) {
      // Label doesn't exist, create it
      const color = label === "released" ? "0E8A16" : "0366D6"; // Green for released, blue for version
      execSync(`gh label create "${label}" --color "${color}" --description "PR included in ${label}"`);
      console.log(chalk.green(`Created label: ${label}`));
    }
  }
}

async function commentOnPRs(prs, releaseVersion) {
  // Ensure labels exist before adding them to PRs
  const labels = ["released", `v${releaseVersion}`];
  await ensureLabelsExist(labels);

  for (const pr of prs) {
    try {
      // Add comment to PR
      const comment = `🎉 This PR has been included in [v${releaseVersion}](https://github.com/salesforce-ux/slds-linter/releases/tag/${releaseVersion}). Thank you for your contribution!`;
      execSync(
        `gh pr comment ${pr} --body "${comment}"`
      );
      console.log(chalk.green(`Commented on PR #${pr}`));

      // Add labels to PR
      execSync(
        `gh pr edit ${pr} --add-label "${labels.join(",")}"`
      );
      console.log(chalk.green(`Added labels to PR #${pr}: ${labels.join(", ")}`));
    } catch (error) {
      console.error(chalk.red(`Error commenting on PR #${pr}:`), error.message);
    }
  }
}

async function main() {
  try {
    console.log(chalk.blue("Starting PR comment process..."));
    
    const { currentRelease, previousRelease } = await getLatestReleases();
    console.log(chalk.blue(`Comparing releases: ${previousRelease} -> ${currentRelease}`));
    
    const commits = await getCommitsBetweenReleases(currentRelease, previousRelease);
    console.log(chalk.blue(`Found ${commits.length} commits between releases`));
    
    const prs = await getPRsFromCommits(commits);
    console.log(chalk.blue(`Found ${prs.length} PRs to comment on`));
    
    await commentOnPRs(prs, currentRelease);
    
    console.log(chalk.green("Successfully commented on all PRs!"));
  } catch (error) {
    console.error(chalk.red("Error:"), chalk.red(error.message));
    process.exit(1);
  }
}

main(); 