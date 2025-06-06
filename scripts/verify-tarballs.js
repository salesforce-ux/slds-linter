import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { globby, isDynamicPattern } from "globby";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

export async function verifyTarballs(tarballs, expectedVersion) {
  console.log(chalk.yellow("Verifying tarballs..."));
  
  for (const { pkgName, tarball, pkgPath } of tarballs) {
    console.log(chalk.blue(`Verifying ${pkgName}...`));
    
    const originalPackageJson = path.join(pkgPath, "package.json");
    const originalPkg = JSON.parse(await fs.readFile(originalPackageJson, "utf8"));
    
    const tempDir = path.join(ROOT_DIR, "temp-verify", pkgName.replace(/[@/]/g, "-"));
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      execSync(`cd ${tempDir} && tar -xzf ${tarball}`);
      
      // Extracted package directory (usually named "package")
      const extractedDir = path.join(tempDir, "package");
      
      const extractedPackageJson = path.join(extractedDir, "package.json");
      if (!(await fs.access(extractedPackageJson).then(() => true).catch(() => false))) {
        throw new Error(`package.json not found in tarball for ${pkgName}`);
      }
      
      const pkg = JSON.parse(await fs.readFile(extractedPackageJson, "utf8"));
      if (pkg.version !== expectedVersion) {
        throw new Error(`Version mismatch in ${pkgName}: expected ${expectedVersion}, got ${pkg.version}`);
      }
      
      const filesToCheck = ["package.json"]; // package.json is always included
      
      if (originalPkg.files && Array.isArray(originalPkg.files)) {
        filesToCheck.push(...originalPkg.files);
        
        for (const filePattern of originalPkg.files) {
          if (isDynamicPattern(filePattern)) {
            const matchingFiles = await globby(filePattern, {
              cwd: extractedDir,
              dot: true, // Include dotfiles
              onlyFiles: false // Include directories
            });
            
            if (matchingFiles.length === 0) {
              throw new Error(`No files match glob pattern in tarball for ${pkgName}: ${filePattern}`);
            }
            
            console.log(chalk.gray(`    Glob pattern "${filePattern}" matched ${matchingFiles.length} files`));
          } else {
            const filePath = path.join(extractedDir, filePattern);
            if (!(await fs.access(filePath).then(() => true).catch(() => false))) {
              throw new Error(`File specified in "files" field not found in tarball for ${pkgName}: ${filePattern}`);
            }
          }
        }
        
      } else {
        throw new Error(`  No "files" field found in ${pkgName}`);
      }
      
      console.log(chalk.green(`✓ ${pkgName} tarball verified successfully`));
      console.log(chalk.gray(`  Version: ${pkg.version}`));
      console.log(chalk.gray(`  Files: ${filesToCheck.join(", ")}`));
      if (originalPkg.files) {
        console.log(chalk.gray(`  Based on "files" field: [${originalPkg.files.join(", ")}]`));
      }
      
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
  
  console.log(chalk.green(`All ${tarballs.length} tarballs verified successfully!`));
} 