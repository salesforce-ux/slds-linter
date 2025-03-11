import { CliOptions } from "../types";
import path from "path";
import { accessSync } from "fs";
import { globSync } from "glob";

export function validateAndNormalizePath(inputPath?: string): string {
  if (!inputPath) {
    return process.cwd();
  }

  const files = globSync(inputPath);
  let normalizedPaths = [];
  files.forEach((filePath) => {
    const normalizedPath = path.resolve(filePath);
    try {
      // Check if path exists and is accessible
      accessSync(normalizedPath);
      normalizedPaths.push(normalizedPath);
    } catch (error) {
      throw new Error(`Invalid path: ${filePath}`);
    }
  });
  return normalizedPaths.join("_files_");
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
    directory: validateAndNormalizePath(options.directory),
    output: validateAndNormalizePath(options.output),
  };
}
