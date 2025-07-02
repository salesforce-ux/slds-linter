import { Rule } from "postcss";

export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
    if (typeof property !== 'string') return false;
    return property.startsWith('--sds-') 
    || property.startsWith('--slds-') 
    || property.startsWith('--lwc-') 
    || propertyTargets.length === 0
    || propertyTargets.includes(property);
}

export function hasMatchedProperty(rule: Rule, propertyTargets: string[] = []): boolean {
    return propertyTargets.length === 0 || rule.nodes.some((node) => {
        return node.type === "decl" && isTargetProperty(node.prop, propertyTargets);
    });
}