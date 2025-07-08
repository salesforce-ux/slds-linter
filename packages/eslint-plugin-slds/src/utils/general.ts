export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
    if (typeof property !== 'string') return false;
    return property.startsWith('--sds-') 
    || property.startsWith('--slds-') 
    || property.startsWith('--lwc-') 
    || propertyTargets.length === 0
    || propertyTargets.includes(property);
} 