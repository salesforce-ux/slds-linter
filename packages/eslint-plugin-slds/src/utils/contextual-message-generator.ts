import type { ComponentContext } from './component-context-collector';
import type { EnhancedSuggestion } from './context-aware-suggestion-scorer';

/**
 * Rich violation report with contextual information
 */
export interface RichViolationReport {
  /** Primary error message */
  message: string;
  /** Enhanced suggestions with context */
  suggestions: EnhancedSuggestion[];
  /** Contextual help information */
  contextualHelp: {
    componentType: string;
    relatedFiles: string[];
    semanticHints: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  /** Quick fix options */
  quickFixes: {
    autofix?: string;        // For high-confidence suggestions
    alternatives: string[];   // For multiple good options
  };
  /** Additional metadata for IDE integration */
  metadata: {
    ruleId: string;
    severity: 'error' | 'warning' | 'info';
    category: string;
    tags: string[];
  };
}

/**
 * Contextual message generator that creates rich, informative violation reports
 * with intelligent suggestions based on component context
 */
export class ContextualMessageGenerator {

  /**
   * Generate a rich violation report with context-aware messaging
   */
  generateRichReport(
    hardcodedValue: string,
    cssProperty: string,
    suggestions: EnhancedSuggestion[],
    context: ComponentContext
  ): RichViolationReport {
    
    const topSuggestion = suggestions[0];
    const confidenceLevel = this.determineConfidenceLevel(suggestions);
    
    return {
      message: this.generatePrimaryMessage(hardcodedValue, topSuggestion, context, confidenceLevel),
      suggestions,
      contextualHelp: {
        componentType: context.componentType,
        relatedFiles: [...context.htmlFiles, ...context.cssFiles],
        semanticHints: this.generateSemanticHints(context, cssProperty),
        confidenceLevel
      },
      quickFixes: {
        autofix: topSuggestion?.canAutoFix ? this.generateAutoFix(hardcodedValue, topSuggestion) : undefined,
        alternatives: suggestions.slice(0, 3).map(s => this.generateAlternativeFix(hardcodedValue, s))
      },
      metadata: {
        ruleId: 'no-hardcoded-values-slds2',
        severity: confidenceLevel === 'high' ? 'error' : 'warning',
        category: topSuggestion?.semanticCategory || 'general',
        tags: this.generateTags(context, suggestions)
      }
    };
  }

  /**
   * Generate the primary error message with context
   */
  generatePrimaryMessage(
    hardcodedValue: string,
    topSuggestion: EnhancedSuggestion | undefined,
    context: ComponentContext,
    confidenceLevel: 'high' | 'medium' | 'low'
  ): string {
    
    if (!topSuggestion) {
      return `Replace hardcoded value '${hardcodedValue}' - no SLDS2 styling hook found. Consider using custom properties.`;
    }

    const contextPhrase = this.getContextPhrase(context);
    
    switch (confidenceLevel) {
      case 'high':
        return `Replace '${hardcodedValue}' with '${topSuggestion.hook}' ${contextPhrase}. ${topSuggestion.contextReasons[0] || 'Recommended SLDS2 styling hook'}.`;
      
      case 'medium':
        const reasonText = topSuggestion.contextReasons.length > 0 
          ? `(${topSuggestion.contextReasons[0]})` 
          : '';
        return `Consider replacing '${hardcodedValue}' with '${topSuggestion.hook}' ${reasonText} ${contextPhrase}.`;
      
      case 'low':
        const alternativeCount = Math.min(3, topSuggestion ? 1 : 0);
        return `Replace '${hardcodedValue}' with an SLDS2 styling hook ${contextPhrase}. ${alternativeCount} option${alternativeCount !== 1 ? 's' : ''} available.`;
    }
  }

  /**
   * Generate contextual phrase based on component analysis
   */
  private getContextPhrase(context: ComponentContext): string {
    const phrases: string[] = [];
    
    if (context.componentType !== 'Unknown') {
      phrases.push(`in ${context.componentType} component`);
    }

    const semanticTypes = [];
    if (context.semanticContext.hasModal) semanticTypes.push('modal');
    if (context.semanticContext.hasButton) semanticTypes.push('button');
    if (context.semanticContext.hasForm) semanticTypes.push('form');
    if (context.semanticContext.hasCard) semanticTypes.push('card');

    if (semanticTypes.length > 0) {
      phrases.push(`with ${semanticTypes.join(', ')} elements`);
    }

    return phrases.length > 0 ? `(${phrases.join(', ')})` : '';
  }

  /**
   * Determine overall confidence level from suggestions
   */
  private determineConfidenceLevel(suggestions: EnhancedSuggestion[]): 'high' | 'medium' | 'low' {
    if (suggestions.length === 0) return 'low';
    
    const topConfidence = suggestions[0].confidence;
    
    if (topConfidence >= 0.8) return 'high';
    if (topConfidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate semantic hints for contextual help
   */
  private generateSemanticHints(context: ComponentContext, cssProperty: string): string[] {
    const hints: string[] = [];

    // Component-specific hints
    if (context.semanticContext.hasModal) {
      hints.push('Modal components typically use modal-specific styling hooks');
    }

    if (context.semanticContext.hasButton) {
      hints.push('Button components should use button-specific color and spacing hooks');
    }

    if (context.semanticContext.hasForm) {
      hints.push('Form components benefit from input and form-specific styling hooks');
    }

    if (context.semanticContext.hasDataTable) {
      hints.push('Data table components should use table-specific styling hooks');
    }

    // Property-specific hints
    if (cssProperty.includes('color')) {
      hints.push('Color properties should use semantic color hooks (primary, secondary, success, error)');
    }

    if (cssProperty.includes('margin') || cssProperty.includes('padding')) {
      hints.push('Spacing properties should use consistent spacing scale hooks');
    }

    if (cssProperty.includes('font')) {
      hints.push('Typography properties should use typography scale hooks');
    }

    // Consistency hints
    if (context.cssContext.existingHooks.length > 0) {
      hints.push(`Component already uses ${context.cssContext.existingHooks.length} SLDS2 hook${context.cssContext.existingHooks.length !== 1 ? 's' : ''} - maintain consistency`);
    }

    // SLDS class hints
    if (context.semanticContext.sldsComponents.length > 0) {
      hints.push(`Component uses SLDS classes: ${context.semanticContext.sldsComponents.slice(0, 3).join(', ')}${context.semanticContext.sldsComponents.length > 3 ? '...' : ''}`);
    }

    return hints;
  }

  /**
   * Generate auto-fix string for high-confidence suggestions
   */
  private generateAutoFix(hardcodedValue: string, suggestion: EnhancedSuggestion): string {
    return `var(${suggestion.hook}, ${suggestion.fallbackValue})`;
  }

  /**
   * Generate alternative fix option
   */
  private generateAlternativeFix(hardcodedValue: string, suggestion: EnhancedSuggestion): string {
    const confidence = Math.round(suggestion.confidence * 100);
    const reasons = suggestion.contextReasons.length > 0 
      ? ` (${suggestion.contextReasons[0]})` 
      : '';
    
    return `${suggestion.hook} [${confidence}%]${reasons}`;
  }

  /**
   * Generate tags for categorization and filtering
   */
  private generateTags(context: ComponentContext, suggestions: EnhancedSuggestion[]): string[] {
    const tags: string[] = [];

    // Component type tags
    if (context.componentType !== 'Unknown') {
      tags.push(context.componentType.toLowerCase());
    }

    // Semantic tags
    if (context.semanticContext.hasModal) tags.push('modal');
    if (context.semanticContext.hasButton) tags.push('button');
    if (context.semanticContext.hasForm) tags.push('form');
    if (context.semanticContext.hasDataTable) tags.push('datatable');
    if (context.semanticContext.hasCard) tags.push('card');
    if (context.semanticContext.hasNavigation) tags.push('navigation');

    // Category tags from suggestions
    const categories = [...new Set(suggestions.map(s => s.semanticCategory))];
    tags.push(...categories);

    // Confidence tags
    const confidenceLevel = this.determineConfidenceLevel(suggestions);
    tags.push(`confidence-${confidenceLevel}`);

    // Auto-fix availability
    if (suggestions.some(s => s.canAutoFix)) {
      tags.push('auto-fixable');
    }

    return tags;
  }

  /**
   * Generate progressive disclosure content for IDE integration
   */
  generateProgressiveDisclosure(report: RichViolationReport): {
    level1: string; // Basic message
    level2: string; // With confidence and reasoning
    level3: string; // Full context analysis
    level4: string; // Detailed guidance
  } {
    
    const level1 = report.message;
    
    const level2 = report.suggestions.length > 0 
      ? `${level1}\n\nTop suggestion: ${report.suggestions[0].hook} (${Math.round(report.suggestions[0].confidence * 100)}% confidence)`
      : level1;
    
    const level3 = `${level2}\n\nContext: ${report.contextualHelp.componentType} component with ${report.contextualHelp.relatedFiles.length} related files\nSemantic hints: ${report.contextualHelp.semanticHints.slice(0, 2).join('; ')}`;
    
    const level4 = `${level3}\n\nAll suggestions:\n${report.suggestions.slice(0, 5).map(s => 
      `• ${s.hook} (${Math.round(s.confidence * 100)}%) - ${s.contextReasons.join(', ') || 'General hook'}`
    ).join('\n')}\n\nRelated files: ${report.contextualHelp.relatedFiles.join(', ')}`;

    return { level1, level2, level3, level4 };
  }

  /**
   * Generate markdown documentation for the violation
   */
  generateDocumentation(report: RichViolationReport, hardcodedValue: string, cssProperty: string): string {
    const topSuggestion = report.suggestions[0];
    
    return `## SLDS2 Styling Hook Recommendation

### Issue
Hardcoded value \`${hardcodedValue}\` found in \`${cssProperty}\` property.

### Recommended Solution
${topSuggestion ? `Replace with: \`var(${topSuggestion.hook}, ${topSuggestion.fallbackValue})\`` : 'No direct replacement available - consider custom properties.'}

### Context Analysis
- **Component Type**: ${report.contextualHelp.componentType}
- **Confidence Level**: ${report.contextualHelp.confidenceLevel}
- **Related Files**: ${report.contextualHelp.relatedFiles.length} files analyzed

### Why This Suggestion?
${topSuggestion?.contextReasons.map(reason => `- ${reason}`).join('\n') || 'No specific context reasons available.'}

### Alternative Options
${report.suggestions.slice(1, 4).map(s => 
  `- \`${s.hook}\` (${Math.round(s.confidence * 100)}% confidence) - ${s.contextReasons[0] || 'General hook'}`
).join('\n')}

### Best Practices
${report.contextualHelp.semanticHints.map(hint => `- ${hint}`).join('\n')}

---
*Generated by SLDS2 Context-Aware Linter*`;
  }
}
