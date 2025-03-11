import { CliOptions } from "../types";
import path from "path";
import { accessSync } from "fs";
import { glob, globSync } from "glob";

export function validateAndNormalizeDirPath(inputPath?: string): string {
  try {
    if (!inputPath) {
      return process.cwd();
    }
    //Checks whether it is a valid glob string else errors out.
    if (glob.sync(inputPath)) return inputPath;

  } catch (error) {
    throw new Error(`Invalid glob path: ${inputPath}`);
  }
}

export function validateAndNormalizeOutputPath(inputPath?: string): string {
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

export function normalizeCliOptions(
  options: CliOptions,
  defultOptions: Partial<CliOptions> = {}
): Required<CliOptions> {
  return {
    fix: false,
    editor: "vscode",
    config: "",
    configStyle: "",
    configEslint: "",
    ...defultOptions,
    ...options,
    directory: validateAndNormalizeDirPath(options.directory),
    output: validateAndNormalizeOutputPath(options.output),
  };
}
