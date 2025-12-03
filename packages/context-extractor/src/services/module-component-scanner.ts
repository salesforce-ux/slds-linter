import path from "path";
import { globby } from "globby";
import { Logger } from "../utils/logger";
import { normalizePath } from "../utils/path-utils";

export type MarkupExtension = "cmp" | "app" | "html";
export type ScriptExtension = "js" | "ts";
export type StyleExtension = "css";

export interface ComponentBundle {
  componentName: string;
  namespace: string;
  path: string; // path to component folder relative to rootDir
  module: string;
  markup: string[]; // paths to markup files relative to component folder
  styles: string[]; // paths to style files relative to component folder
  script: string[]; // paths to script files relative to component folder
}

export type ModuleBundleMap = Record<string, ComponentBundle[]>;

const MARKUP_EXTENSIONS: MarkupExtension[] = ["cmp", "html"];
const SCRIPT_EXTENSIONS: ScriptExtension[] = ["js", "ts"];
const STYLE_EXTENSIONS: StyleExtension[] = ["css"];

const COMPONENT_ROOT_DIR_NAMES = ["components", "modules"];

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function getExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext.startsWith(".") ? ext.slice(1) : ext;
}

function classifyFile(relativeFilePathFromComponent: string):
  | "markup"
  | "script"
  | "styles"
  | null {
  const ext = getExtension(relativeFilePathFromComponent).toLowerCase();

  if (MARKUP_EXTENSIONS.includes(ext as MarkupExtension)) {
    return "markup";
  }
  if (SCRIPT_EXTENSIONS.includes(ext as ScriptExtension)) {
    return "script";
  }
  if (STYLE_EXTENSIONS.includes(ext as StyleExtension)) {
    return "styles";
  }

  return null;
}

const CSS_PATTERN = "**/{components,modules}/**/*.css";

export async function scanComponentBundles(rootDir: string): Promise<ModuleBundleMap> {
  const normalizedRoot = normalizePath(rootDir);

  const spinner = Logger.spinner(`Scanning for component bundles in: ${normalizedRoot}`);

  // First, find all CSS files under components/modules
  const cssMatches = await globby(CSS_PATTERN, {
    cwd: normalizedRoot,
    onlyFiles: true,
    absolute: false,
    gitignore: true,
    dot: true,
  });

  spinner.stop(true);

  Logger.info(`Found ${cssMatches.length} CSS files to evaluate for bundles`);

  const results: ModuleBundleMap = {};
  const processedComponents = new Set<string>();

  for (const rawRelativePath of cssMatches) {
    const relativePath = toPosix(rawRelativePath);
    const segments = relativePath.split("/").filter(Boolean);

    if (segments.length < 5 || relativePath.includes('/test/')) {
      // Minimum expected: moduleDir/(...)/components|modules/namespace/component/file
      continue;
    }

    const moduleDir = segments[0];

    if (!results[moduleDir]) {
      Logger.debug(`Discovered new module directory: ${moduleDir}`);
    }

    const componentRootIndex = segments.findIndex((segment) =>
      COMPONENT_ROOT_DIR_NAMES.includes(segment)
    );

    if (componentRootIndex === -1) {
      continue;
    }

    const namespace = segments[componentRootIndex + 1];
    const componentName = segments[componentRootIndex + 2];

    if (!namespace || !componentName) {
      continue;
    }

    const fileName = segments[segments.length - 1];
    const baseName = path.basename(fileName, path.extname(fileName));

    if (baseName !== componentName) {
      continue;
    }

    const componentFolderSegments = segments.slice(0, componentRootIndex + 3);
    const componentFolderPathFromRoot = componentFolderSegments.join("/");

    if (!results[moduleDir]) {
      results[moduleDir] = [];
    }

    let bundle = results[moduleDir].find(
      (b) =>
        b.componentName === componentName &&
        b.namespace === namespace &&
        b.path === componentFolderPathFromRoot &&
        b.module === moduleDir
    );

    if (!bundle) {
      bundle = {
        componentName,
        namespace,
        path: componentFolderPathFromRoot,
        module: moduleDir,
        markup: [],
        styles: [],
        script: [],
      };
      results[moduleDir].push(bundle);
      Logger.debug(
        `Created bundle: module=${moduleDir}, namespace=${namespace}, component=${componentName}`
      );
    }

    if (processedComponents.has(componentFolderPathFromRoot)) {
      continue;
    }
    processedComponents.add(componentFolderPathFromRoot);

    // Find all relevant files for this component within its folder
    const componentFiles = await globby(
      [
        `${componentName}.css`,
        `${componentName}.html`,
        `${componentName}.cmp`,
        `${componentName}.js`,
        `${componentName}.ts`,
      ],
      {
        cwd: path.join(normalizedRoot, componentFolderPathFromRoot),
        onlyFiles: true,
        absolute: false,
        gitignore: true,
        dot: true,
      }
    );

    for (const relFromComponent of componentFiles) {
      const relPosix = toPosix(relFromComponent);
      const kind = classifyFile(relPosix);
      if (!kind) {
        continue;
      }
      bundle[kind].push(relPosix);
    }
  }

  const moduleCount = Object.keys(results).length;
  Logger.info(
    `Completed bundle scan. Modules: ${moduleCount}, Components: ${Object.values(results).reduce(
      (acc, bundles) => acc + bundles.length,
      0
    )}`
  );

  return results;
}
