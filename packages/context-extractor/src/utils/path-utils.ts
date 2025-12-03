import path from "path";

export function normalizePath(p: string){
    return path.resolve(process.cwd(), p);
}
