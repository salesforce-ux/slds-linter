export interface ExtractContextOptions {
    corePath: string;    
}

export type SuggestionType =
    | "surface"
    | "surface-container"
    | "accent"
    | "on-accent"
    | "on-surface"
    | "palette"
    | "feedback";

export interface ContextIssue {
    file: string;
    line: number;
    property: "background-color" | "color";
    value: string;
    suggestionType: SuggestionType;
    contextReason: string;
}

export interface AuditBundleOptions {
    rootDir: string;
    bundle: ComponentBundle;
}

export type BundleFileKind = "markup" | "styles" | "script";

export type MarkupExtension = "cmp" | "app" | "html";
export type ScriptExtension = "js" | "ts";
export type StyleExtension = "css";

export interface ComponentBundle {
    componentName: string;
    namespace: string;
    path: string; // path to component folder relative to rootDir
    module: string;
    markup: string | null; // path to markup file relative to component folder
    styles: string | null; // path to style file relative to component folder
    script: string | null; // path to script file relative to component folder
}

export type ModuleBundleMap = Record<string, ComponentBundle[]>;
