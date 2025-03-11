import { CliOptions } from "../types";
import path from "path";
import { accessSync } from "fs";
import { isDynamicPattern } from "globby";

export function nomalizeAndValidatePath(inputPath?: string): string {
  if (!inputPath) {
    return process.cwd();
  }

  const normalizedPath = path.resolve(inputPath);

  try {
    // Check if path exists and is accessible
    accessSync(normalizedPath);
    return normalizedPath;
  } catch (error) {
    throw new Error(`Invalid path: ${inputPath}`);
  }
}

export function nomalizeDirPath(inputPath?: string): string {
  if (!inputPath) {
    return process.cwd();
  }
  // return the inputPath if the glob pattern is supplied
  if (isDynamicPattern(inputPath)) {
    return inputPath;
  }
  return nomalizeAndValidatePath(inputPath);
}

export function normalizeCliOptions(
  options: CliOptions,
  defultOptions: Partial<CliOptions> = {}
): Required<CliOptions> {
  return {
    fix: false,
    editor: "vscode",
    configStylelint: "",
    configEslint: "",
    ...defultOptions,
    ...options,
    directory: nomalizeDirPath(options.directory),
    output: nomalizeAndValidatePath(options.output),
  };
}
