# 🏗️ Context-Aware Linting Architecture

## 📊 System Overview Diagram

```mermaid
graph TB
    %% Input Layer
    subgraph "📁 Input Files"
        CSS["`**CSS Files**
        • button.css
        • modal.css
        • component.css`"]
        HTML["`**HTML Templates**
        • button.html
        • modal.html
        • component.html`"]
    end

    %% ESLint Integration Layer
    subgraph "🔧 ESLint Integration"
        ESLINT["`**ESLint Engine**
        • File processing
        • Rule execution
        • Result reporting`"]
        PLUGIN["`**SLDS Plugin**
        • Rule registration
        • Configuration
        • Metadata integration`"]
    end

    %% Enhanced Rule Layer
    subgraph "🎯 Enhanced Rule System"
        ENHANCED["`**Enhanced Rule**
        no-hardcoded-values-slds2-enhanced
        • Context-aware analysis
        • Intelligent suggestions
        • Rich messaging`"]
        STANDARD["`**Standard Rule**
        no-hardcoded-values-slds2
        • Basic hardcoded detection
        • Generic suggestions`"]
    end

    %% Context Analysis Layer
    subgraph "🧠 Context Analysis Engine"
        COLLECTOR["`**ComponentContextCollector**
        • File discovery
        • Component type detection
        • Semantic analysis`"]
        SCORER["`**ContextAwareSuggestionScorer**
        • Multi-factor scoring
        • Confidence calculation
        • Hook prioritization`"]
        GENERATOR["`**ContextualMessageGenerator**
        • Rich message creation
        • Educational content
        • Contextual explanations`"]
    end

    %% Analysis Components
    subgraph "🔍 Analysis Components"
        COLOR["`**Color Analysis**
        🎯 Enhanced Color Analysis
        • Component-specific colors
        • Brand/theme awareness
        • State-based suggestions`"]
        DENSITY["`**Density Analysis**
        📏 Enhanced Density Analysis
        • Spacing patterns
        • Component sizing
        • Layout awareness`"]
        SHADOW["`**Shadow Analysis**
        🌫️ Enhanced Shadow Analysis
        • Elevation context
        • Component shadows
        • Interaction states`"]
        FONT["`**Font Analysis**
        ✏️ Enhanced Font Analysis
        • Typography patterns
        • Hierarchy awareness
        • Accessibility compliance`"]
    end

    %% Data Sources
    subgraph "📚 Data Sources"
        METADATA["`**SLDS Metadata**
        @salesforce-ux/sds-metadata
        • ValueToStylingHooksMapping
        • Component definitions
        • Design tokens`"]
        PATTERNS["`**Component Patterns**
        • SLDS class mappings
        • Semantic relationships
        • Usage contexts`"]
    end

    %% Output Layer
    subgraph "📤 Output & Results"
        VIOLATIONS["`**Enhanced Violations**
        • Context-aware messages
        • Confidence scores
        • Educational guidance`"]
        SUGGESTIONS["`**Smart Suggestions**
        • Component-specific hooks
        • Prioritized options
        • Auto-fix capabilities`"]
        REPORTS["`**Rich Reports**
        • IDE integration
        • Progressive disclosure
        • Learning resources`"]
    end

    %% Connections
    CSS --> ESLINT
    HTML --> ESLINT
    ESLINT --> PLUGIN
    PLUGIN --> ENHANCED
    PLUGIN --> STANDARD
    
    ENHANCED --> COLLECTOR
    ENHANCED --> SCORER
    ENHANCED --> GENERATOR
    
    COLLECTOR --> COLOR
    COLLECTOR --> DENSITY
    COLLECTOR --> SHADOW
    COLLECTOR --> FONT
    
    SCORER --> METADATA
    SCORER --> PATTERNS
    
    COLOR --> VIOLATIONS
    DENSITY --> VIOLATIONS
    SHADOW --> VIOLATIONS
    FONT --> VIOLATIONS
    
    GENERATOR --> SUGGESTIONS
    SCORER --> SUGGESTIONS
    
    VIOLATIONS --> REPORTS
    SUGGESTIONS --> REPORTS

    %% Styling
    classDef inputFiles fill:#e1f5fe
    classDef eslintLayer fill:#f3e5f5
    classDef ruleLayer fill:#e8f5e8
    classDef contextLayer fill:#fff3e0
    classDef analysisLayer fill:#fce4ec
    classDef dataLayer fill:#e0f2f1
    classDef outputLayer fill:#f1f8e9

    class CSS,HTML inputFiles
    class ESLINT,PLUGIN eslintLayer
    class ENHANCED,STANDARD ruleLayer
    class COLLECTOR,SCORER,GENERATOR contextLayer
    class COLOR,DENSITY,SHADOW,FONT analysisLayer
    class METADATA,PATTERNS dataLayer
    class VIOLATIONS,SUGGESTIONS,REPORTS outputLayer
```

## 🔄 Data Flow Diagram

```mermaid
sequenceDiagram
    participant F as 📁 Files (CSS/HTML)
    participant E as 🔧 ESLint
    participant R as 🎯 Enhanced Rule
    participant C as 🧠 Context Collector
    participant A as 🔍 Analysis Engine
    participant S as 📊 Suggestion Scorer
    participant G as 📝 Message Generator
    participant O as 📤 Output

    F->>E: CSS/HTML files
    E->>R: Process with enhanced rule
    R->>C: Collect component context
    
    Note over C: Find related files<br/>Detect component types<br/>Extract semantic context
    
    C->>A: Component context + CSS properties
    
    par Color Analysis
        A->>A: 🎯 Analyze colors
    and Density Analysis
        A->>A: 📏 Analyze spacing
    and Shadow Analysis
        A->>A: 🌫️ Analyze shadows
    and Font Analysis
        A->>A: ✏️ Analyze typography
    end
    
    A->>S: Hardcoded values + context
    S->>S: Calculate confidence scores<br/>Rank suggestions<br/>Apply component filters
    
    S->>G: Scored suggestions + context
    G->>G: Generate rich messages<br/>Add educational content<br/>Create contextual explanations
    
    G->>O: Enhanced violations + suggestions
    O->>E: Rich ESLint results
    E->>F: Developer feedback
```

## 🏛️ Component Architecture

```mermaid
classDiagram
    class ComponentContextCollector {
        +collectContext(filename: string): ComponentContext
        +findRelatedFiles(directory: string): string[]
        +detectComponentType(files: string[]): ComponentType
        +extractSemanticContext(htmlFiles: string[]): SemanticContext
        -analyzeHTMLContext(content: string): HTMLAnalysis
        -analyzeCSSContext(content: string): CSSAnalysis
    }

    class ContextAwareSuggestionScorer {
        +scoreHooks(value: string, context: ComponentContext): EnhancedSuggestion[]
        +calculateConfidence(hook: string, context: ComponentContext): number
        +generateReasons(hook: string, context: ComponentContext): string[]
        -categorizeHook(hook: string): HookCategory
        -getApplicableComponents(hook: string): string[]
        -getFallbackValue(hook: string): string
    }

    class ContextualMessageGenerator {
        +generateMessage(violation: HardcodedValueViolation, suggestions: EnhancedSuggestion[], context: ComponentContext): string
        +createEducationalContent(suggestions: EnhancedSuggestion[]): string
        +formatConfidenceExplanation(suggestion: EnhancedSuggestion): string
        -buildContextualExplanation(context: ComponentContext): string
        -generateLearningTips(suggestions: EnhancedSuggestion[]): string[]
    }

    class EnhancedNoHardcodedValueRule {
        +create(context: ESLintContext): RuleDefinition
        +meta: RuleMetaData
        -initializeComponents(): void
        -processDeclaration(node: CSSNode): void
        -handleEnhancedAnalysis(node: CSSNode, context: EnhancedHandlerContext): void
    }

    class ComponentContext {
        +htmlTemplates: string[]
        +cssFiles: string[]
        +componentType: ComponentType
        +semanticContext: SemanticContext
        +relatedFiles: number
        +existingHooks: number
    }

    class EnhancedSuggestion {
        +hook: string
        +confidence: number
        +reasons: string[]
        +category: HookCategory
        +fallbackValue: string
        +educationalNote: string
    }

    class SemanticContext {
        +hasModal: boolean
        +hasButton: boolean
        +hasForm: boolean
        +hasCard: boolean
        +hasDataTable: boolean
        +sldsComponents: string[]
        +customClasses: string[]
    }

    EnhancedNoHardcodedValueRule --> ComponentContextCollector
    EnhancedNoHardcodedValueRule --> ContextAwareSuggestionScorer
    EnhancedNoHardcodedValueRule --> ContextualMessageGenerator
    ComponentContextCollector --> ComponentContext
    ContextAwareSuggestionScorer --> EnhancedSuggestion
    ComponentContext --> SemanticContext
```

## 🔧 Handler Architecture

```mermaid
graph TB
    subgraph "🎯 Property Handlers"
        CH["`**Color Handler**
        handleColor()
        • RGB/HEX detection
        • Brand color mapping
        • Theme awareness`"]
        DH["`**Density Handler**
        handleDensity()
        • Spacing analysis
        • Size calculations
        • Layout patterns`"]
        SH["`**Shadow Handler**
        handleBoxShadow()
        • Elevation mapping
        • Shadow parsing
        • Component context`"]
        FH["`**Font Handler**
        handleFont()
        • Typography analysis
        • Font property parsing
        • Hierarchy detection`"]
    end

    subgraph "🧠 Enhanced Context"
        EC["`**EnhancedHandlerContext**
        • ComponentContext
        • SuggestionScorer
        • MessageGenerator
        • EnableContextAnalysis`"]
    end

    subgraph "📊 Analysis Flow"
        DETECT["`**Detection Phase**
        • Parse CSS value
        • Identify property type
        • Extract hardcoded values`"]
        CONTEXT["`**Context Phase**
        • Collect component context
        • Analyze semantic meaning
        • Identify usage patterns`"]
        SCORE["`**Scoring Phase**
        • Calculate confidence
        • Rank suggestions
        • Apply filters`"]
        MESSAGE["`**Message Phase**
        • Generate rich messages
        • Add educational content
        • Create explanations`"]
    end

    EC --> CH
    EC --> DH
    EC --> SH
    EC --> FH

    CH --> DETECT
    DH --> DETECT
    SH --> DETECT
    FH --> DETECT

    DETECT --> CONTEXT
    CONTEXT --> SCORE
    SCORE --> MESSAGE
```

## 🎨 Context Analysis Pipeline

```mermaid
flowchart LR
    subgraph "📁 File Discovery"
        SCAN["`**Scan Directory**
        • Find CSS files
        • Find HTML files
        • Identify patterns`"]
        FILTER["`**Filter Related**
        • Same directory
        • Naming patterns
        • Component structure`"]
    end

    subgraph "🔍 Content Analysis"
        PARSE_HTML["`**Parse HTML**
        • Extract SLDS classes
        • Identify components
        • Find custom classes`"]
        PARSE_CSS["`**Parse CSS**
        • Extract selectors
        • Find properties
        • Identify patterns`"]
    end

    subgraph "🧠 Semantic Analysis"
        DETECT_TYPE["`**Detect Component Type**
        • LWC patterns
        • Aura patterns
        • Standard HTML`"]
        EXTRACT_CONTEXT["`**Extract Context**
        • Modal detection
        • Button detection
        • Form detection`"]
    end

    subgraph "📊 Context Building"
        BUILD["`**Build Context**
        • Combine analyses
        • Create semantic map
        • Calculate metrics`"]
        VALIDATE["`**Validate Context**
        • Check consistency
        • Verify patterns
        • Flag anomalies`"]
    end

    SCAN --> FILTER
    FILTER --> PARSE_HTML
    FILTER --> PARSE_CSS
    PARSE_HTML --> DETECT_TYPE
    PARSE_CSS --> DETECT_TYPE
    DETECT_TYPE --> EXTRACT_CONTEXT
    EXTRACT_CONTEXT --> BUILD
    BUILD --> VALIDATE
```

## 🎯 Suggestion Scoring Algorithm

```mermaid
graph TB
    subgraph "📥 Input"
        VALUE["`**Hardcoded Value**
        #0176d3, 8px, etc.`"]
        CONTEXT["`**Component Context**
        Button, Modal, Form`"]
        PROPERTY["`**CSS Property**
        background-color, padding`"]
    end

    subgraph "🔍 Analysis Factors"
        SEMANTIC["`**Semantic Match**
        Weight: 40%
        • Component type alignment
        • Usage pattern match
        • Context relevance`"]
        PROPERTY_MATCH["`**Property Match**
        Weight: 30%
        • Property type alignment
        • Value type compatibility
        • Usage appropriateness`"]
        VALUE_PROXIMITY["`**Value Proximity**
        Weight: 20%
        • Color distance
        • Size similarity
        • Exact matches`"]
        USAGE_PATTERNS["`**Usage Patterns**
        Weight: 10%
        • Frequency of use
        • Best practices
        • Team preferences`"]
    end

    subgraph "📊 Confidence Calculation"
        CALCULATE["`**Calculate Score**
        Confidence = Σ(Factor × Weight)
        • Weighted sum
        • Normalization
        • Threshold application`"]
        RANK["`**Rank Suggestions**
        • Sort by confidence
        • Apply filters
        • Limit results`"]
    end

    subgraph "📤 Output"
        SUGGESTIONS["`**Enhanced Suggestions**
        • Ranked by confidence
        • With explanations
        • Educational notes`"]
    end

    VALUE --> SEMANTIC
    CONTEXT --> SEMANTIC
    PROPERTY --> PROPERTY_MATCH
    VALUE --> VALUE_PROXIMITY
    CONTEXT --> USAGE_PATTERNS

    SEMANTIC --> CALCULATE
    PROPERTY_MATCH --> CALCULATE
    VALUE_PROXIMITY --> CALCULATE
    USAGE_PATTERNS --> CALCULATE

    CALCULATE --> RANK
    RANK --> SUGGESTIONS
```

## 🏗️ File Structure Architecture

```
packages/eslint-plugin-slds/
├── 📁 src/
│   ├── 📁 rules/v9/no-hardcoded-values/
│   │   ├── 📄 no-hardcoded-values-slds2.ts              # Standard rule
│   │   ├── 📄 no-hardcoded-values-slds2-enhanced.ts     # Enhanced rule
│   │   ├── 📄 noHardcodedValueRule.ts                   # Base rule logic
│   │   └── 📄 enhancedNoHardcodedValueRule.ts           # Enhanced base logic
│   ├── 📁 utils/
│   │   ├── 📄 component-context-collector.ts            # Context collection
│   │   ├── 📄 context-aware-suggestion-scorer.ts        # Suggestion scoring
│   │   ├── 📄 contextual-message-generator.ts           # Message generation
│   │   └── 📄 hardcoded-shared-utils.ts                 # Shared utilities
│   ├── 📁 handlers/v9/
│   │   ├── 📄 handleColor.ts                            # Color analysis
│   │   ├── 📄 handleDensity.ts                          # Spacing analysis
│   │   ├── 📄 handleBoxShadow.ts                        # Shadow analysis
│   │   └── 📄 handleFont.ts                             # Font analysis
│   ├── 📁 types/
│   │   └── 📄 index.ts                                  # Type definitions
│   └── 📄 index.ts                                      # Plugin entry point
├── 📁 test/poc-comparison/
│   └── 📁 test-components/
│       ├── 📁 modal-component/
│       │   ├── 📄 modal.html                            # Test HTML
│       │   └── 📄 modal.css                             # Test CSS
│       └── 📁 button-component/
│           ├── 📄 button.html                           # Test HTML
│           └── 📄 button.css                            # Test CSS
└── 📁 build/                                           # Compiled output
```

## 🔄 Integration Points

```mermaid
graph LR
    subgraph "🔧 ESLint Integration"
        ESLINT_CORE["`**ESLint Core**
        • Rule registration
        • File processing
        • Result reporting`"]
        PLUGIN_SYSTEM["`**Plugin System**
        • Rule discovery
        • Configuration
        • Metadata access`"]
    end

    subgraph "📚 External Dependencies"
        SDS_METADATA["`**@salesforce-ux/sds-metadata**
        • ValueToStylingHooksMapping
        • Design tokens
        • Component definitions`"]
        CSS_TREE["`**@eslint/css-tree**
        • CSS parsing
        • AST manipulation
        • Property analysis`"]
    end

    subgraph "🎯 Enhanced Rule System"
        ENHANCED_RULE["`**Enhanced Rules**
        • Context-aware analysis
        • Intelligent suggestions
        • Rich messaging`"]
    end

    subgraph "🛠️ Development Tools"
        TYPESCRIPT["`**TypeScript**
        • Type safety
        • IDE support
        • Compile-time checks`"]
        JEST["`**Jest Testing**
        • Unit tests
        • Integration tests
        • Coverage reports`"]
    end

    ESLINT_CORE --> PLUGIN_SYSTEM
    PLUGIN_SYSTEM --> ENHANCED_RULE
    SDS_METADATA --> ENHANCED_RULE
    CSS_TREE --> ENHANCED_RULE
    TYPESCRIPT --> ENHANCED_RULE
    JEST --> ENHANCED_RULE
```

## 📊 Performance Considerations

```mermaid
graph TB
    subgraph "⚡ Performance Optimizations"
        CACHE["`**Context Caching**
        • File analysis cache
        • Component detection cache
        • Suggestion scoring cache`"]
        LAZY["`**Lazy Loading**
        • On-demand file reading
        • Deferred context analysis
        • Progressive enhancement`"]
        PARALLEL["`**Parallel Processing**
        • Multi-file analysis
        • Concurrent scoring
        • Async operations`"]
    end

    subgraph "📏 Metrics & Monitoring"
        TIMING["`**Performance Timing**
        • Analysis duration
        • File processing time
        • Suggestion generation time`"]
        MEMORY["`**Memory Usage**
        • Context storage
        • Cache management
        • Garbage collection`"]
        THROUGHPUT["`**Throughput Metrics**
        • Files per second
        • Violations per minute
        • Suggestion accuracy`"]
    end

    CACHE --> TIMING
    LAZY --> MEMORY
    PARALLEL --> THROUGHPUT
```

This architecture diagram shows the complete context-aware linting system with all components, data flows, and integration points. The system is designed to be modular, extensible, and performance-optimized while providing intelligent, context-aware suggestions for SLDS2 migration.
