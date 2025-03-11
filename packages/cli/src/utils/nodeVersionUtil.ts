import semver from 'semver';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {resolve} from 'import-meta-resolve'; // This package is a ponyfill for import.meta.resolve Node 16-20
import { Logger } from './logger'; // Ensure this path is correct

export const REQUIRED_NODE_VERSION = ">=18.4.0";

/**
 * Checks if the current Node.js version meets the required version.
 * @param {string} requiredVersion - The required Node.js version.
 * @returns {boolean} - Returns true if the current version is valid.
 */
export function checkNodeVersion(requiredVersion) {
  return semver.satisfies(process.version, requiredVersion);
}

/**
 * Validates the Node.js version and exits if it does not meet the requirement.
 */
export function validateNodeVersion() {
  if (!checkNodeVersion(REQUIRED_NODE_VERSION)) {
    if(checkNodeVersion("<18.4.x")){
      Logger.warning(
        `SLDS Linter CLI works best with Node.js version v18.4.0 or later. 
        We recommend using the latest [Active LTS](https://nodejs.org/en/about/previous-releases) version of Node.js.`
      );
    }
  }
}

/**
 * Util to resolve dirName from import meta compatible with node v18
 * Letst version of node have import.meta.dirname
 * @param importMeta 
 * @returns 
 */
export function resolveDirName(importMeta:ImportMeta){
  if("dirname" in importMeta){
    return importMeta.dirname;
  }
  return dirname(fileURLToPath((importMeta as ImportMeta).url));
}

export function resolvePath(specifier:string, importMeta:ImportMeta) {
  let fileUrl = ''
  if("resolve" in importMeta){
    fileUrl = importMeta.resolve(specifier);    
  } else {
    fileUrl = resolve(specifier, (importMeta as ImportMeta).url)//new URL(specifier, (importMeta as ImportMeta).url).href;
  }
  return fileURLToPath(fileUrl);
};