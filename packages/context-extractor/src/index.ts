import path from "path";

function normalizePath(p: string){
    return path.resolve(process.cwd(), p);
}

export default function extractContext(options: ExtractContextOptions){
    const corePath = normalizePath(options.corePath);
    console.log("Extracting context", corePath);
}

if(import.meta.url === `file://${process.argv[1]}`){
    extractContext({
        corePath: process.argv[2]
    });
}