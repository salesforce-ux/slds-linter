import type { ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';
import type { ComponentContext } from './component-context-collector';

/**
 * Enhanced suggestion with context-aware scoring
 */
export interface EnhancedSuggestion {
  /** The SLDS2 styling hook */
  hook: string;
  /** Confidence score (0-1) based on context analysis */
  confidence: number;
  /** Reasons why this suggestion fits the context */
  contextReasons: string[];
  /** Semantic category of the hook */
  semanticCategory: 'spacing' | 'color' | 'typography' | 'shadow' | 'sizing' | 'border' | 'general';
  /** Component types this hook is commonly used with */
  applicableComponents: string[];
  /** Original fallback value for the hook */
  fallbackValue: string;
  /** Whether this suggestion can be auto-fixed */
  canAutoFix: boolean;
}

/**
 * Context-aware suggestion scorer that provides intelligent hook recommendations
 * based on component context, semantic analysis, and usage patterns
 */
export class ContextAwareSuggestionScorer {
  
  /**
   * Score and rank styling hook suggestions based on context
   */
  scoreHooks(
    hardcodedValue: string,
    availableHooks: string[],
    context: ComponentContext,
    cssProperty: string,
    valueToStylinghook: ValueToStylingHooksMapping
  ): EnhancedSuggestion[] {
    
    const suggestions = availableHooks.map(hook => {
      const confidence = this.calculateConfidence(hook, context, cssProperty, hardcodedValue);
      const contextReasons = this.generateContextReasons(hook, context, cssProperty);
      const semanticCategory = this.categorizeHook(hook, cssProperty);
      const applicableComponents = this.getApplicableComponents(hook, semanticCategory);
      const fallbackValue = this.getFallbackValue(hook, valueToStylinghook, hardcodedValue);
      
      return {
        hook,
        confidence,
        contextReasons,
        semanticCategory,
        applicableComponents,
        fallbackValue,
        canAutoFix: confidence > 0.7 // High confidence suggestions can be auto-fixed
      };
    });

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  private calculateConfidence(
    hook: string,
    context: ComponentContext,
    cssProperty: string,
    hardcodedValue: string
  ): number {
    let score = 0;
    
    // Base score for property match (30%)
    score += this.calculatePropertyMatchScore(hook, cssProperty) * 0.3;
    
    // Semantic context score (40%)
    score += this.calculateSemanticContextScore(hook, context) * 0.4;
    
    // Value proximity score (20%)
    score += this.calculateValueProximityScore(hook, hardcodedValue) * 0.2;
    
    // Usage pattern score (10%)
    score += this.calculateUsagePatternScore(hook, context) * 0.1;
    
    return Math.min(score, 1); // Cap at 1.0
  }

  /**
   * Calculate score based on property name matching
   */
  private calculatePropertyMatchScore(hook: string, cssProperty: string): number {
    const hookLower = hook.toLowerCase();
    const propertyLower = cssProperty.toLowerCase();
    
    // Direct property name matches
    if (hookLower.includes(propertyLower)) {
      return 1.0;
    }
    
    // Property family matches
    const propertyFamilies: Record<string, string[]> = {
      'color': ['color', 'background', 'border', 'text', 'fill', 'stroke'],
      'spacing': ['margin', 'padding', 'gap', 'space'],
      'sizing': ['width', 'height', 'size', 'min', 'max'],
      'typography': ['font', 'text', 'line-height', 'letter-spacing'],
      'border': ['border', 'outline', 'stroke'],
      'shadow': ['shadow', 'box-shadow', 'drop-shadow']
    };
    
    for (const [family, properties] of Object.entries(propertyFamilies)) {
      if (properties.some(prop => propertyLower.includes(prop)) && 
          hookLower.includes(family)) {
        return 0.8;
      }
    }
    
    // Partial matches
    const propertyParts = propertyLower.split('-');
    const hookParts = hookLower.split('-');
    
    const commonParts = propertyParts.filter(part => 
      hookParts.some(hookPart => hookPart.includes(part) || part.includes(hookPart))
    );
    
    return Math.min(commonParts.length / propertyParts.length * 0.6, 0.6);
  }

  /**
   * Calculate score based on semantic context
   */
  private calculateSemanticContextScore(hook: string, context: ComponentContext): number {
    let score = 0;
    const hookLower = hook.toLowerCase();
    
    // Component-specific hooks
    if (context.semanticContext.hasModal && hookLower.includes('modal')) {
      score += 0.4;
    }
    
    if (context.semanticContext.hasButton && hookLower.includes('button')) {
      score += 0.4;
    }
    
    if (context.semanticContext.hasForm && (hookLower.includes('form') || hookLower.includes('input'))) {
      score += 0.4;
    }
    
    if (context.semanticContext.hasDataTable && hookLower.includes('table')) {
      score += 0.4;
    }
    
    if (context.semanticContext.hasCard && hookLower.includes('card')) {
      score += 0.4;
    }
    
    if (context.semanticContext.hasNavigation && (hookLower.includes('nav') || hookLower.includes('menu'))) {
      score += 0.4;
    }
    
    // SLDS component class correlation
    const relevantSldsClasses = context.semanticContext.sldsComponents.filter(className => {
      const classLower = className.toLowerCase();
      return hookLower.includes(classLower.replace('slds-', '')) || 
             classLower.includes(hookLower.replace('--slds-', ''));
    });
    
    if (relevantSldsClasses.length > 0) {
      score += Math.min(relevantSldsClasses.length * 0.2, 0.3);
    }
    
    // Existing hooks correlation
    const similarExistingHooks = context.cssContext.existingHooks.filter(existingHook => {
      const existingLower = existingHook.toLowerCase();
      const hookBase = hookLower.split('-').slice(0, 3).join('-'); // Compare base hook pattern
      const existingBase = existingLower.split('-').slice(0, 3).join('-');
      return hookBase === existingBase;
    });
    
    if (similarExistingHooks.length > 0) {
      score += 0.2; // Consistency bonus
    }
    
    return Math.min(score, 1);
  }

  /**
   * Calculate score based on value proximity (how close the hardcoded value is to the hook's value)
   */
  private calculateValueProximityScore(hook: string, hardcodedValue: string): number {
    // This would ideally use the actual hook values from metadata
    // For now, we'll use heuristics based on common patterns
    
    const hookLower = hook.toLowerCase();
    const valueLower = hardcodedValue.toLowerCase();
    
    // Size correlations
    if (valueLower.includes('px') || valueLower.includes('rem')) {
      const numericValue = parseFloat(hardcodedValue);
      
      if (hookLower.includes('small') && numericValue <= 8) return 0.8;
      if (hookLower.includes('medium') && numericValue > 8 && numericValue <= 16) return 0.8;
      if (hookLower.includes('large') && numericValue > 16 && numericValue <= 32) return 0.8;
      if (hookLower.includes('xlarge') && numericValue > 32) return 0.8;
    }
    
    // Color correlations
    if (this.isColorValue(hardcodedValue)) {
      if (hookLower.includes('primary') && this.isPrimaryColor(hardcodedValue)) return 0.8;
      if (hookLower.includes('secondary') && this.isSecondaryColor(hardcodedValue)) return 0.8;
      if (hookLower.includes('success') && this.isSuccessColor(hardcodedValue)) return 0.8;
      if (hookLower.includes('error') && this.isErrorColor(hardcodedValue)) return 0.8;
      if (hookLower.includes('warning') && this.isWarningColor(hardcodedValue)) return 0.8;
    }
    
    return 0.5; // Default moderate score
  }

  /**
   * Calculate score based on usage patterns in similar components
   */
  private calculateUsagePatternScore(hook: string, context: ComponentContext): number {
    // This would ideally use analytics data about hook usage patterns
    // For now, we'll use component type heuristics
    
    let score = 0;
    const hookLower = hook.toLowerCase();
    
    // Component type preferences
    switch (context.componentType) {
      case 'LWC':
        if (hookLower.includes('component') || hookLower.includes('lwc')) {
          score += 0.3;
        }
        break;
      case 'Aura':
        if (hookLower.includes('aura') || hookLower.includes('legacy')) {
          score += 0.3;
        }
        break;
    }
    
    // Frequency-based scoring (would come from real usage data)
    const commonHooks = [
      '--slds-c-button-color-background',
      '--slds-c-button-color-border',
      '--slds-g-spacing-small',
      '--slds-g-spacing-medium',
      '--slds-g-color-neutral-base-100'
    ];
    
    if (commonHooks.includes(hook)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  /**
   * Generate human-readable reasons for the suggestion
   */
  private generateContextReasons(
    hook: string,
    context: ComponentContext,
    cssProperty: string
  ): string[] {
    const reasons: string[] = [];
    const hookLower = hook.toLowerCase();
    
    // Property-based reasons
    if (hookLower.includes(cssProperty.toLowerCase())) {
      reasons.push(`matches ${cssProperty} property`);
    }
    
    // Component-based reasons
    if (context.semanticContext.hasModal && hookLower.includes('modal')) {
      reasons.push('component contains modal elements');
    }
    
    if (context.semanticContext.hasButton && hookLower.includes('button')) {
      reasons.push('component contains button elements');
    }
    
    if (context.semanticContext.hasForm && (hookLower.includes('form') || hookLower.includes('input'))) {
      reasons.push('component contains form elements');
    }
    
    // Consistency reasons
    if (context.cssContext.existingHooks.length > 0) {
      const similarHooks = context.cssContext.existingHooks.filter(existing => 
        existing.split('-').slice(0, 3).join('-') === hook.split('-').slice(0, 3).join('-')
      );
      
      if (similarHooks.length > 0) {
        reasons.push('consistent with existing hooks in component');
      }
    }
    
    // SLDS class correlation
    const relevantClasses = context.semanticContext.sldsComponents.filter(className =>
      hookLower.includes(className.replace('slds-', '').toLowerCase())
    );
    
    if (relevantClasses.length > 0) {
      reasons.push(`aligns with ${relevantClasses.join(', ')} classes`);
    }
    
    return reasons.length > 0 ? reasons : ['general SLDS2 styling hook'];
  }

  /**
   * Categorize hook by semantic purpose
   */
  private categorizeHook(hook: string, cssProperty: string): EnhancedSuggestion['semanticCategory'] {
    const hookLower = hook.toLowerCase();
    const propertyLower = cssProperty.toLowerCase();
    
    if (hookLower.includes('color') || hookLower.includes('background') || 
        propertyLower.includes('color') || propertyLower.includes('background')) {
      return 'color';
    }
    
    if (hookLower.includes('spacing') || hookLower.includes('margin') || hookLower.includes('padding') ||
        propertyLower.includes('margin') || propertyLower.includes('padding')) {
      return 'spacing';
    }
    
    if (hookLower.includes('font') || hookLower.includes('text') || 
        propertyLower.includes('font') || propertyLower.includes('text')) {
      return 'typography';
    }
    
    if (hookLower.includes('shadow') || propertyLower.includes('shadow')) {
      return 'shadow';
    }
    
    if (hookLower.includes('size') || hookLower.includes('width') || hookLower.includes('height') ||
        propertyLower.includes('width') || propertyLower.includes('height')) {
      return 'sizing';
    }
    
    if (hookLower.includes('border') || propertyLower.includes('border')) {
      return 'border';
    }
    
    return 'general';
  }

  /**
   * Get component types this hook is commonly used with
   */
  private getApplicableComponents(hook: string, category: EnhancedSuggestion['semanticCategory']): string[] {
    const hookLower = hook.toLowerCase();
    const components: string[] = [];
    
    // Component-specific hooks
    if (hookLower.includes('button')) components.push('Button');
    if (hookLower.includes('modal')) components.push('Modal');
    if (hookLower.includes('card')) components.push('Card');
    if (hookLower.includes('table')) components.push('DataTable');
    if (hookLower.includes('form') || hookLower.includes('input')) components.push('Form');
    if (hookLower.includes('nav')) components.push('Navigation');
    
    // Category-based applicability
    switch (category) {
      case 'color':
        components.push('All Components');
        break;
      case 'spacing':
        components.push('Layout', 'Container', 'Grid');
        break;
      case 'typography':
        components.push('Text', 'Heading', 'Label');
        break;
      case 'shadow':
        components.push('Card', 'Modal', 'Dropdown');
        break;
    }
    
    return components.length > 0 ? components : ['General'];
  }

  /**
   * Get fallback value for the hook
   */
  private getFallbackValue(
    hook: string,
    valueToStylinghook: ValueToStylingHooksMapping,
    originalValue: string
  ): string {
    // Try to find the fallback value from metadata
    for (const [value, hookEntries] of Object.entries(valueToStylinghook)) {
      // hookEntries is an array of ValueToStylingHookEntry objects
      const hasHook = Array.isArray(hookEntries) && hookEntries.some(entry => 
        typeof entry === 'object' && entry !== null && 'name' in entry && entry.name === hook
      );
      if (hasHook) {
        return value;
      }
    }
    
    // Fallback to original value
    return originalValue;
  }

  /**
   * Helper methods for value analysis
   */
  private isColorValue(value: string): boolean {
    return /^#[0-9a-f]{3,8}$/i.test(value) ||
           /^rgb\(/i.test(value) ||
           /^rgba\(/i.test(value) ||
           /^hsl\(/i.test(value) ||
           /^hsla\(/i.test(value);
  }

  private isPrimaryColor(value: string): boolean {
    // Blue-ish colors
    return /#0176d3|#1589ee|#0070d2/i.test(value);
  }

  private isSecondaryColor(value: string): boolean {
    // Gray-ish colors
    return /#747474|#5c5c5c|#444444/i.test(value);
  }

  private isSuccessColor(value: string): boolean {
    // Green-ish colors
    return /#04844b|#2e844a|#027e46/i.test(value);
  }

  private isErrorColor(value: string): boolean {
    // Red-ish colors
    return /#ea001e|#c23934|#ba0517/i.test(value);
  }

  private isWarningColor(value: string): boolean {
    // Orange/Yellow-ish colors
    return /#ffb75d|#fe9339|#dd7a01/i.test(value);
  }
}
