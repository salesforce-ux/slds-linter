import { camelCase } from "change-case";
import * as esbuild from "esbuild";
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { glob } from "glob";
import { series } from "gulp";
import { task } from "gulp-execa";
import { writeFileSync } from "node:fs";
import { parse, relative } from "node:path";
import { rimraf } from "rimraf";
import { normalizeData } from "./.scripts/sldshooks.metadata.parser.mjs";

/**
 * Clean all generated folder
 * @returns
 */
function cleanDirs() {
  return rimraf(["build"]);
}

async function generateTokensDataFile() {
  const listOfFiles = await glob(`./resources/*.json`);
  const namedExports = [];
  const content = listOfFiles
    .map((filePath) => {
      const fileNameParts = parse(filePath);
      const importName = camelCase(fileNameParts.name);
      const importPath = relative("./src", filePath);
      namedExports.push(importName);
      return `const ${importName} = require(${JSON.stringify(importPath)});`;
    })
    .join("\n");

  writeFileSync(
    "./src/tokens-data.ts",
    `
/**
 *  This file is auto-generated from script
 *  DO NOT EDIT
 */
${content}

export {${namedExports.sort().join(",")}}
    `
  );
}

/**
  * Compile typescript files
  * */ 
async function generateBundle() {
  await esbuild.build({
    entryPoints: ["./src/*.ts"],
    bundle:true,
    outdir:"build",
    platform: "node",
    format:"esm",
    minify:true,
    packages:'external',
    plugins:[esbuildPluginFilePathExtensions({
      esmExtension:"js"
    })]
  })
}

/**
  * ESBuild bydefault won't generate definition file. There are multiple ways 
  * to generate definition files. But we are reliying on tsc for now
  * */ 
const generateDefinitions = task('tsc --project tsconfig.json');

/**
 * This method uses resources/globalSharedHooks.metadata.json to generate value --> hooks mapping for bothe slds and slds-plus
 */
export async function value2HooksMappings() {
  await normalizeData("slds");
  await normalizeData("slds2");
}

export const build = series(
  cleanDirs,
  value2HooksMappings,
  generateTokensDataFile,
  generateBundle,
  generateDefinitions
);

export default task("gulp --tasks");
