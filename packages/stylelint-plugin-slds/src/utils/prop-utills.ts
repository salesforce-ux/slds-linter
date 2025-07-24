import { Rule } from "postcss";
import { isTargetProperty } from 'slds-shared-utils';

export { isTargetProperty };

export function hasMatchedProperty(rule: Rule, propertyTargets: string[] = []): boolean {
    return propertyTargets.length === 0 || rule.nodes.some((node) => {
        return node.type === "decl" && isTargetProperty(node.prop, propertyTargets);
    });
}