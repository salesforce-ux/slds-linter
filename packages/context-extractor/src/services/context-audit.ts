import path from "path";
import { promises as fs } from "fs";
import * as csstree from "@eslint/css-tree";
import type { AuditBundleOptions, ContextIssue, SuggestionType } from "../types";
import { Logger } from "../utils/logger";

export async function auditBundle(
  options: AuditBundleOptions
): Promise<ContextIssue[]> {
  const { rootDir, bundle } = options;

  const issues: ContextIssue[] = [];
  Logger.debug(`Auditing bundle: ${bundle.componentName} (${bundle.namespace})`);

  const cssFile = bundle.styles;
  if (!cssFile) {
    return issues;
  }

  const componentRoot = path.join(rootDir, bundle.path);
  const cssPath = path.join(componentRoot, cssFile);
  Logger.debug(`Auditing CSS file: ${cssPath}`);
  const cssSource = await fs.readFile(cssPath, "utf8");

  const htmlFile = bundle.markup;
  if (htmlFile) {
    const htmlPath = path.join(componentRoot, htmlFile);
    Logger.debug(`Auditing HTML file: ${htmlPath}`);
    // Read markup for future use once extractBackgroundContext/extractColorContext
    // start leveraging DOM context. For now this is intentionally unused.
    await fs.readFile(htmlPath, "utf8");
  }

  const ast = csstree.parse(cssSource, {
    positions: true,
    filename: cssPath,
  });

  csstree.walk(ast, {
    visit: "Declaration",
    enter(node) {
      const decl = node as csstree.Declaration;
      const prop = decl.property as "background-color" | "color";

      if (prop !== "background-color" && prop !== "color") {
        return;
      }

      // `this` is a walk context that exposes closest ancestor nodes,
      // including `rule` for the nearest Rule node.
      const rule = (this as any).rule as csstree.Rule | undefined;
      if (!rule || !rule.prelude) {
        return;
      }

      const selectorText = csstree.generate(rule.prelude).trim();
      if (!selectorText) {
        return;
      }

      let context: { suggestion: SuggestionType; type: string } | null = null;

      if (prop === "background-color") {
        context = extractBackgroundContext();
      } else if (prop === "color") {
        context = extractColorContext();
      }

      if (!context) {
        return;
      }

      const value = csstree.generate(decl.value);
      const line = decl.loc?.start.line ?? 0;

      issues.push({
        file: cssPath,
        line,
        property: prop,
        value,
        suggestionType: context.suggestion,
        contextReason: context.type,
      });
    },
  });

  return issues;
}

function extractBackgroundContext():
  | { suggestion: SuggestionType; type: string }
  | null {
  return null;
}

function extractColorContext():
  | { suggestion: SuggestionType; type: string }
  | null {
  return null;
}