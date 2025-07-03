import { isTargetProperty } from './shared/general';
export { isTargetProperty } from './shared/general';
import { Rule } from "postcss";

export function hasMatchedProperty(rule: Rule, propertyTargets: string[] = []): boolean {
    return propertyTargets.length === 0 || rule.nodes.some((node) => {
        return node.type === "decl" && isTargetProperty(node.prop, propertyTargets);
    });
}