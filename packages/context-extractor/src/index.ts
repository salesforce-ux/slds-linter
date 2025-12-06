
import { scanComponentBundles } from "./services/module-component-scanner";
import { writeFileSync } from "fs";
import { normalizePath } from "./utils/path-utils";
import type { ExtractContextOptions } from "./types";


async function extractBundles(corePath: string){
    console.log("Extracting bundles", corePath);
    const bundles = await scanComponentBundles(corePath);
    writeFileSync(normalizePath('./bundles.json'), JSON.stringify(bundles, null, 2));
}


export default async function extractContext(options: ExtractContextOptions){
    const corePath = normalizePath(options.corePath);
    await extractBundles(corePath);
}

if(import.meta.url === `file://${process.argv[1]}`){
    extractContext({
        corePath: process.argv[2]
    });
}