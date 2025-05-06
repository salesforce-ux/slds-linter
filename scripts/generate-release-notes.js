import { execSync } from "child_process";
import chalk from "chalk";
import conventionalCommitsParser from "conventional-commits-parser";

export async function generateReleaseNotes(version, previousVersion) {
  try {
    // Get all commits between versions
    const commits = execSync(`git log ${previousVersion}..HEAD --pretty=format:"%s|%b"`)
      .toString()
      .trim()
      .split("\n");

    const categories = {
      feat: [],
      fix: [],
      chore: [],
      docs: [],
      refactor: [],
      style: [],
      test: [],
      perf: [],
      ci: [],
      build: []
    };

    // Parse and categorize commits
    for (const commit of commits) {
      const [subject, body] = commit.split("|");
      const parsed = conventionalCommitsParser.sync(subject + (body ? "\n\n" + body : ""));
      
      if (parsed.type && categories[parsed.type]) {
        const message = parsed.scope 
          ? `${parsed.scope}: ${parsed.subject}`
          : parsed.subject;
        categories[parsed.type].push(message);
      }
    }

    // Generate release notes
    let releaseNotes = `# Release ${version}\n\n`;

    // Features
    if (categories.feat.length > 0) {
      releaseNotes += "## Features\n\n";
      categories.feat.forEach(feat => {
        releaseNotes += `- ${feat}\n`;
      });
      releaseNotes += "\n";
    }

    // Fixes
    if (categories.fix.length > 0) {
      releaseNotes += "## Fixes\n\n";
      categories.fix.forEach(fix => {
        releaseNotes += `- ${fix}\n`;
      });
      releaseNotes += "\n";
    }

    // Changes (includes refactor, docs, style, etc.)
    const changes = [
      ...categories.refactor,
      ...categories.docs,
      ...categories.style,
      ...categories.test,
      ...categories.perf,
      ...categories.ci,
      ...categories.build,
      ...categories.chore
    ];

    if (changes.length > 0) {
      releaseNotes += "## Changes\n\n";
      changes.forEach(change => {
        releaseNotes += `- ${change}\n`;
      });
      releaseNotes += "\n";
    }

    return releaseNotes;
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not generate detailed release notes: ${error.message}`));
    return `Release ${version}`;
  }
} 