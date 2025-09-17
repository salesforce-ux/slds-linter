import * as path from 'path';
import * as fs from 'fs';
import { Rule } from 'eslint';
// Note: @html-eslint/parser doesn't export parse directly
// We'll implement HTML parsing differently or use a different approach
import { parse as parseCss } from '@eslint/css-tree';

/**
 * Component context information extracted from related files
 */
export interface ComponentContext {
  /** HTML template files associated with this component */
  htmlFiles: string[];
  /** CSS files associated with this component */
  cssFiles: string[];
  /** Component framework type */
  componentType: 'LWC' | 'Aura' | 'Standard' | 'Unknown';
  /** Semantic indicators from HTML analysis */
  semanticContext: SemanticContext;
  /** CSS context from related stylesheets */
  cssContext: CSSContext;
  /** File relationships and dependencies */
  fileRelationships: FileRelationship[];
}

/**
 * Semantic context extracted from HTML templates
 */
export interface SemanticContext {
  /** Component contains modal-related elements */
  hasModal: boolean;
  /** Component contains button elements */
  hasButton: boolean;
  /** Component contains form elements */
  hasForm: boolean;
  /** Component contains data table elements */
  hasDataTable: boolean;
  /** Component contains card elements */
  hasCard: boolean;
  /** Component contains navigation elements */
  hasNavigation: boolean;
  /** SLDS component classes found */
  sldsComponents: string[];
  /** Custom component classes found */
  customClasses: string[];
}

/**
 * CSS context from related stylesheets
 */
export interface CSSContext {
  /** Properties that commonly appear together */
  propertyCooccurrence: Map<string, string[]>;
  /** Selectors and their context */
  selectors: SelectorContext[];
  /** CSS custom properties defined */
  customProperties: string[];
  /** SLDS hooks already in use */
  existingHooks: string[];
}

/**
 * Selector context information
 */
export interface SelectorContext {
  selector: string;
  properties: string[];
  isComponentSpecific: boolean;
  semanticHint: string;
}

/**
 * File relationship information
 */
export interface FileRelationship {
  filePath: string;
  relationship: 'template' | 'style' | 'script' | 'related';
  confidence: number; // 0-1 confidence this file is related
}

/**
 * Component context collector for ESLint v9
 * Analyzes file bundles to provide intelligent context for linting rules
 */
export class ComponentContextCollector {
  constructor(private eslintContext: Rule.RuleContext) {}

  /**
   * Collect comprehensive context for a given file
   */
  async collectContext(currentFile: string): Promise<ComponentContext> {
    try {
      const fileRelationships = await this.findRelatedFiles(currentFile);
      const htmlFiles = fileRelationships
        .filter(rel => rel.relationship === 'template')
        .map(rel => rel.filePath);
      const cssFiles = fileRelationships
        .filter(rel => rel.relationship === 'style')
        .map(rel => rel.filePath);

      const semanticContext = await this.analyzeSemanticContext(htmlFiles);
      const cssContext = await this.analyzeCSSContext(cssFiles);
      const componentType = this.detectComponentType(currentFile, fileRelationships);

      return {
        htmlFiles,
        cssFiles,
        componentType,
        semanticContext,
        cssContext,
        fileRelationships
      };
    } catch (error) {
      // Fallback to minimal context on error
      return this.createMinimalContext();
    }
  }

  /**
   * Find files related to the current component
   */
  private async findRelatedFiles(currentFile: string): Promise<FileRelationship[]> {
    const relationships: FileRelationship[] = [];
    const currentDir = path.dirname(currentFile);
    const baseName = path.basename(currentFile, path.extname(currentFile));
    const workspaceRoot = this.eslintContext.getCwd?.() || process.cwd();

    try {
      // Look for co-located files (LWC pattern)
      const colocatedFiles = await this.findColocatedFiles(currentDir, baseName);
      relationships.push(...colocatedFiles);

      // Look for component directory patterns (Aura pattern)
      const componentFiles = await this.findComponentDirectoryFiles(currentDir);
      relationships.push(...componentFiles);

      // Look for related files in parent/sibling directories
      const relatedFiles = await this.findRelatedDirectoryFiles(currentFile, workspaceRoot);
      relationships.push(...relatedFiles);

    } catch (error) {
      // Silent fallback
    }

    return relationships;
  }

  /**
   * Find co-located files (LWC pattern: component.html, component.css, component.js)
   */
  private async findColocatedFiles(dir: string, baseName: string): Promise<FileRelationship[]> {
    const relationships: FileRelationship[] = [];
    const extensions = ['.html', '.css', '.js', '.ts'];

    for (const ext of extensions) {
      const filePath = path.join(dir, `${baseName}${ext}`);
      if (await this.fileExists(filePath)) {
        relationships.push({
          filePath,
          relationship: this.getRelationshipType(ext),
          confidence: 0.9 // High confidence for co-located files
        });
      }
    }

    return relationships;
  }

  /**
   * Find files in component directory (Aura pattern)
   */
  private async findComponentDirectoryFiles(dir: string): Promise<FileRelationship[]> {
    const relationships: FileRelationship[] = [];

    try {
      const files = await fs.promises.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const ext = path.extname(file);
        
        if (['.cmp', '.app', '.html'].includes(ext)) {
          relationships.push({
            filePath,
            relationship: 'template',
            confidence: 0.8
          });
        } else if (['.css'].includes(ext)) {
          relationships.push({
            filePath,
            relationship: 'style',
            confidence: 0.8
          });
        }
      }
    } catch (error) {
      // Silent fallback
    }

    return relationships;
  }

  /**
   * Find related files in broader directory structure
   */
  private async findRelatedDirectoryFiles(currentFile: string, workspaceRoot: string): Promise<FileRelationship[]> {
    const relationships: FileRelationship[] = [];
    const currentDir = path.dirname(currentFile);
    const relativePath = path.relative(workspaceRoot, currentFile);

    // Look for patterns like:
    // - components/myComponent/myComponent.css -> templates/myComponent.html
    // - styles/myComponent.css -> components/myComponent/myComponent.html
    
    const componentName = this.extractComponentName(currentFile);
    if (componentName) {
      const searchDirs = [
        path.join(workspaceRoot, 'force-app', 'main', 'default', 'lwc'),
        path.join(workspaceRoot, 'force-app', 'main', 'default', 'aura'),
        path.join(workspaceRoot, 'src', 'lwc'),
        path.join(workspaceRoot, 'src', 'aura'),
        path.join(currentDir, '..'),
        path.join(currentDir, '..', '..')
      ];

      for (const searchDir of searchDirs) {
        if (await this.directoryExists(searchDir)) {
          const found = await this.searchForComponentFiles(searchDir, componentName);
          relationships.push(...found);
        }
      }
    }

    return relationships;
  }

  /**
   * Analyze semantic context from HTML files
   */
  private async analyzeSemanticContext(htmlFiles: string[]): Promise<SemanticContext> {
    const context: SemanticContext = {
      hasModal: false,
      hasButton: false,
      hasForm: false,
      hasDataTable: false,
      hasCard: false,
      hasNavigation: false,
      sldsComponents: [],
      customClasses: []
    };

    for (const htmlFile of htmlFiles) {
      try {
        const content = await fs.promises.readFile(htmlFile, 'utf-8');
        this.extractSemanticIndicators(content, context);
      } catch (error) {
        // Continue with other files
      }
    }

    return context;
  }

  /**
   * Extract semantic indicators from HTML content
   */
  private extractSemanticIndicators(htmlContent: string, context: SemanticContext): void {
    // Modal indicators
    if (/slds-modal|modal-|<lightning-modal/i.test(htmlContent)) {
      context.hasModal = true;
    }

    // Button indicators
    if (/slds-button|<button|<lightning-button/i.test(htmlContent)) {
      context.hasButton = true;
    }

    // Form indicators
    if (/slds-form|<form|<lightning-input|<lightning-textarea/i.test(htmlContent)) {
      context.hasForm = true;
    }

    // Data table indicators
    if (/slds-table|data-table|<lightning-datatable/i.test(htmlContent)) {
      context.hasDataTable = true;
    }

    // Card indicators
    if (/slds-card|<lightning-card/i.test(htmlContent)) {
      context.hasCard = true;
    }

    // Navigation indicators
    if (/slds-nav|navigation|<lightning-navigation/i.test(htmlContent)) {
      context.hasNavigation = true;
    }

    // Extract SLDS classes
    const sldsClassRegex = /class\s*=\s*["'][^"']*slds-([^"'\s]+)[^"']*["']/gi;
    let match;
    while ((match = sldsClassRegex.exec(htmlContent)) !== null) {
      const className = `slds-${match[1]}`;
      if (!context.sldsComponents.includes(className)) {
        context.sldsComponents.push(className);
      }
    }

    // Extract custom classes (non-SLDS)
    const customClassRegex = /class\s*=\s*["']([^"']*?)["']/gi;
    while ((match = customClassRegex.exec(htmlContent)) !== null) {
      const classes = match[1].split(/\s+/).filter(cls => 
        cls && !cls.startsWith('slds-') && !context.customClasses.includes(cls)
      );
      context.customClasses.push(...classes);
    }
  }

  /**
   * Analyze CSS context from related stylesheets
   */
  private async analyzeCSSContext(cssFiles: string[]): Promise<CSSContext> {
    const context: CSSContext = {
      propertyCooccurrence: new Map(),
      selectors: [],
      customProperties: [],
      existingHooks: []
    };

    for (const cssFile of cssFiles) {
      try {
        const content = await fs.promises.readFile(cssFile, 'utf-8');
        this.extractCSSContext(content, context);
      } catch (error) {
        // Continue with other files
      }
    }

    return context;
  }

  /**
   * Extract CSS context information
   */
  private extractCSSContext(cssContent: string, context: CSSContext): void {
    try {
      const ast = parseCss(cssContent);
      
      // Walk through CSS AST to extract context
      this.walkCSSAST(ast, context);
    } catch (error) {
      // Fallback to regex-based extraction
      this.extractCSSContextFallback(cssContent, context);
    }
  }

  /**
   * Walk CSS AST to extract context information
   */
  private walkCSSAST(ast: any, context: CSSContext): void {
    // Implementation would walk the AST and extract:
    // - Property co-occurrence patterns
    // - Selector contexts
    // - Custom properties
    // - Existing SLDS hooks
    
    // This is a simplified version - full implementation would be more comprehensive
    const cssText = ast.toString();
    this.extractCSSContextFallback(cssText, context);
  }

  /**
   * Fallback CSS context extraction using regex
   */
  private extractCSSContextFallback(cssContent: string, context: CSSContext): void {
    // Extract existing SLDS hooks
    const hookRegex = /--slds-[a-zA-Z0-9-_]+/g;
    let match;
    while ((match = hookRegex.exec(cssContent)) !== null) {
      if (!context.existingHooks.includes(match[0])) {
        context.existingHooks.push(match[0]);
      }
    }

    // Extract custom properties
    const customPropRegex = /--[a-zA-Z][a-zA-Z0-9-_]*(?!slds)/g;
    while ((match = customPropRegex.exec(cssContent)) !== null) {
      if (!context.customProperties.includes(match[0])) {
        context.customProperties.push(match[0]);
      }
    }

    // Extract selector contexts (simplified)
    const ruleRegex = /([^{]+)\s*\{([^}]+)\}/g;
    while ((match = ruleRegex.exec(cssContent)) !== null) {
      const selector = match[1].trim();
      const properties = match[2].match(/[a-zA-Z-]+\s*:/g) || [];
      
      context.selectors.push({
        selector,
        properties: properties.map(p => p.replace(':', '').trim()),
        isComponentSpecific: !selector.startsWith('.slds-'),
        semanticHint: this.getSemanticHint(selector)
      });
    }
  }

  /**
   * Detect component type based on file patterns
   */
  private detectComponentType(
    currentFile: string, 
    relationships: FileRelationship[]
  ): ComponentContext['componentType'] {
    const filePath = currentFile.toLowerCase();
    
    // LWC pattern
    if (filePath.includes('/lwc/') || 
        relationships.some(r => r.filePath.includes('/lwc/'))) {
      return 'LWC';
    }

    // Aura pattern
    if (filePath.includes('/aura/') || 
        relationships.some(r => r.filePath.endsWith('.cmp') || r.filePath.endsWith('.app'))) {
      return 'Aura';
    }

    // Standard web components
    if (relationships.some(r => r.relationship === 'template' || r.relationship === 'style')) {
      return 'Standard';
    }

    return 'Unknown';
  }

  /**
   * Helper methods
   */
  private getRelationshipType(extension: string): FileRelationship['relationship'] {
    switch (extension) {
      case '.html':
      case '.cmp':
      case '.app':
        return 'template';
      case '.css':
        return 'style';
      case '.js':
      case '.ts':
        return 'script';
      default:
        return 'related';
    }
  }

  private extractComponentName(filePath: string): string | null {
    const baseName = path.basename(filePath, path.extname(filePath));
    // Remove common suffixes
    return baseName.replace(/(Controller|Helper|Renderer|Style|Template)$/, '');
  }

  private getSemanticHint(selector: string): string {
    if (selector.includes('modal')) return 'modal';
    if (selector.includes('button')) return 'button';
    if (selector.includes('form')) return 'form';
    if (selector.includes('table')) return 'table';
    if (selector.includes('card')) return 'card';
    if (selector.includes('nav')) return 'navigation';
    return 'general';
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async searchForComponentFiles(searchDir: string, componentName: string): Promise<FileRelationship[]> {
    const relationships: FileRelationship[] = [];
    
    try {
      const entries = await fs.promises.readdir(searchDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.toLowerCase().includes(componentName.toLowerCase())) {
          const componentDir = path.join(searchDir, entry.name);
          const files = await this.findColocatedFiles(componentDir, entry.name);
          relationships.push(...files.map(f => ({ ...f, confidence: f.confidence * 0.7 })));
        }
      }
    } catch {
      // Silent fallback
    }

    return relationships;
  }

  private createMinimalContext(): ComponentContext {
    return {
      htmlFiles: [],
      cssFiles: [],
      componentType: 'Unknown',
      semanticContext: {
        hasModal: false,
        hasButton: false,
        hasForm: false,
        hasDataTable: false,
        hasCard: false,
        hasNavigation: false,
        sldsComponents: [],
        customClasses: []
      },
      cssContext: {
        propertyCooccurrence: new Map(),
        selectors: [],
        customProperties: [],
        existingHooks: []
      },
      fileRelationships: []
    };
  }
}
