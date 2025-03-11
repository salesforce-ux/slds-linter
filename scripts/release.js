import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import prompts from 'prompts';
import semver from 'semver';
import { fileURLToPath } from 'url';
import chalk from 'chalk'; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const isDryRun = process.argv.includes('--dry-run') || false; // Skips publishing npm, git operations
const skipCheck = process.argv.includes('--skip-check') || false; // Skips checking working directory git status

async function getWorkspaceInfo() {
  try{
    const output = execSync('yarn workspaces info --json').toString();
    const matches = output.trim().replace(/\n/g, '').match(/\{(.*)\}/);
    if(!matches || !matches.length)  {
      throw new Error(output);
    }
    return JSON.parse(matches[0]);
  } catch (error) {
    throw new Error(`Failed to parse workspace info: ${error.message}`);
  }
}

async function validateVersion(version) {
  if (!semver.valid(version)) {
    throw new Error('Invalid version format. Please use semver format (e.g., 1.0.0)');
  }
  return true;
}

async function checkExistingTag(version) {
  try {
    return execSync(`git tag -l "${version}"`, { stdio: 'pipe' }).toString().trim();
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
    const pkgPath = path.join(ROOT_DIR, info.location, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    // Update package version
    pkg.version = version;
    
    // Update workspace dependencies
    for (const dep of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (!pkg[dep]) continue;
      
      for (const [depName, depVersion] of Object.entries(pkg[dep])) {
        if (workspaceInfo[depName]) {
          pkg[dep][depName] = version;
        }
      }
    }
    
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

async function gitOperations(version) {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const releaseBranch = `release/${version}`;

  execSync(`git checkout -b ${releaseBranch}`);
  execSync('git add .');
  execSync(`git commit -m "Release ${version}"`);
  execSync(`git push origin ${releaseBranch}`);

  // Create PR from release branch to current branch
  const prUrl = execSync(`gh pr create --base ${currentBranch} --head ${releaseBranch} --title "Release ${version}" --body "Automated release PR"`).toString().trim();
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
  const tag = releaseType === 'final' ? 'latest' : releaseType;
  let sldsLinterTarball = '';

  for (const [pkgName, info] of Object.entries(workspaceInfo)) {
    const pkgPath = path.join(ROOT_DIR, info.location);
    if (pkgName.match(/slds-linter/)) {
      // Generate tarball for slds-linter
      sldsLinterTarball = execSync(`cd ${pkgPath} && npm pack`).toString().trim();
      console.log(chalk.blue(`Generated tarball: ${sldsLinterTarball}`));
      sldsLinterTarball = path.join(pkgPath, sldsLinterTarball);
    }
    execSync(`cd ${pkgPath} && NPM_TOKEN=${process.env.NPM_TOKEN} npm publish --tag ${tag} --access public ${isDryRun?'--dry-run':''}`);
    console.log(chalk.green(`Published ${pkgName}@${version}`));
  }

  return sldsLinterTarball;
}

async function createGitHubRelease(version, tarballPath, releaseType) {
  const releaseNotes = `Release ${version}`;
  const releaseSuffix = releaseType !=="final"?" --prerelease":"";  
  execSync(`gh release create ${version} ${tarballPath} --title "Release ${version}" --notes "${releaseNotes}"${releaseSuffix}`);
  console.log(chalk.green(`Created GitHub release: ${version}`));
}

async function checkWorkingDirectory() {
  try {
    // Check if the working directory is clean
    execSync('git diff --quiet HEAD');

    // Check if the local branch is up to date with the remote
    execSync('git fetch');
    const localCommit = execSync('git rev-parse HEAD').toString().trim();
    const remoteCommit = execSync('git rev-parse @{u}').toString().trim();
    if (localCommit !== remoteCommit) {
      throw new Error('Local branch is not up to date with remote');
    }

    // Check for staged/unstaged changes
    const status = execSync('git status --porcelain').toString();
    if (status.length > 0) {
      throw new Error('There are staged or unstaged changes');
    }

    // Check if gh is installed and authenticated
    execSync('gh --version');
    execSync('gh auth status');

    console.log(chalk.green('Pre-release checks passed successfully.'));
  } catch (error) {
    throw new Error(`Pre-release check failed: ${error.message}`);
  }
}

async function resetWorkingDirectory() {
  try{
    // Reset the working directory with orign
    execSync('git reset --hard');  
    console.log(chalk.green('Post-release checks passed successfully.'));
  } catch (error) {
    throw new Error(`Post-release check failed: ${error.message}`);
  }
}

async function main() {
  try {

    if(!skipCheck){
      console.log(chalk.blue('Perform pre-release checks'));
      await checkWorkingDirectory();
    } else {
      console.warn(chalk.yellow('Skipping pre-release checks'));
    }
    
    console.log(chalk.blue("Get workspace information"));
    const workspaceInfo = await getWorkspaceInfo();
    
    console.log(chalk.blue("Prompt for version"));
    const { version } = await prompts({
      type: 'text',
      name: 'version',
      message: 'Enter the version number (e.g., 1.0.0):',
      validate: validateVersion
    });

    if(!version){
      throw new Error(`Input valid version. Skipping release.`);
    }

    console.log(chalk.blue("Prompt for release type"));
    const { releaseType } = await prompts({
      type: 'select',
      name: 'releaseType',
      message: 'Select release type:',
      choices: [
        { title: 'Final', value: 'final' },
        { title: 'Alpha', value: 'alpha' },
        { title: 'Beta', value: 'beta' }
      ]
    });

    if(!version || !releaseType){
      throw new Error(`Input valid release type. Skipping release.`);
    }

    console.log(chalk.blue("Handle version generation"));
    let finalVersion = version;
    if (releaseType !== 'final') {
      finalVersion = await incrementPreReleaseVersion(version, releaseType);
    }

    console.log(chalk.blue("Update all package versions"));
    await updatePackageVersions(finalVersion, workspaceInfo);

    if(isDryRun){
      console.log(chalk.yellow('Dry run. Skipping git operations'));
    } else {
      console.log(chalk.blue("Git operations"));
      await gitOperations(finalVersion);
    }

    console.log(chalk.blue("Building workspcae..."));
    await execSync("CLI_BUILD_MODE=release yarn build");

    console.log(chalk.blue("Publish packages and get slds-linter tarball path"));
    const sldsLinterTarball = await publishPackages(workspaceInfo, finalVersion, releaseType);

    console.log(chalk.blue("Create GitHub release with slds-linter tarball as asset"));
    if (sldsLinterTarball) {
      if(isDryRun){
        console.log(chalk.yellow('Skipping GitHub release creation due to dry run'));
      } else {
        await createGitHubRelease(finalVersion, sldsLinterTarball, releaseType);
      }
    }

    console.log(chalk.green(`\nRelease ${finalVersion} completed successfully!`));

    if(!skipCheck){
      console.log(chalk.blue("Perform post-release checks"));
      await resetWorkingDirectory();
    } else {
      console.warn(chalk.yellow('Skipping post-release checks'));
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), chalk.red(error.message));
    process.exit(1);
  }
}

main();