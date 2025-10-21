# Cohesion Document

## Project Philosophy

This project provides an ESLint-based linting solution that automatically detects and fixes violations of Salesforce Lightning Design System 2 (SLDS 2) standards in HTML, CSS, and component files to ensure code compliance and facilitate seamless migration to SLDS 2 best practices.

---

## Core Modules

The codebase is organized into four primary modules, each with a single, well-defined responsibility:

- **`src/config/`** – Centralizes all rule metadata including descriptions, documentation URLs, violation messages, and type definitions for ESLint rules.

- **`src/rules/`** – Implements all ESLint rule logic for detecting SLDS violations in HTML, CSS, and component files; existing rules support both legacy (ESLint v8) and modern (ESLint v9+) versions, while all new rules target ESLint v9+ exclusively.

- **`src/types/`** – Defines TypeScript type definitions and interfaces for rule handlers, contexts, and third-party module declarations.

- **`src/utils/`** – Provides shared utility functions for CSS parsing, value extraction, property matching, styling hook validation, and color processing.

---

## Data Flow

The plugin follows ESLint's standard execution model, where data flows through the following pipeline:

1. **Plugin Initialization** – ESLint loads the plugin, which registers all rules, configures file-specific parsers (HTML parser for markup files, CSS parser for style files), and imports rule configurations.

2. **File Parsing** – ESLint parses source files into Abstract Syntax Trees (ASTs) using the appropriate parser, creating node structures that represent HTML elements, CSS declarations, and component attributes.

3. **AST Traversal & Rule Execution** – ESLint traverses the AST and invokes each enabled rule's visitor functions, passing node objects to the rule's creation function based on selector patterns.

4. **Violation Detection** – Rules analyze nodes using utility functions for parsing, value extraction, and property matching, referencing configuration data for SLDS metadata, violation messages, and validation criteria.

5. **Reporting & Auto-fixing** – Rules register violations with error messages, location data, and optional fix functions; ESLint collects all reports and outputs them in the requested format (console, SARIF, etc.).

---

## Key Abstractions

The codebase employs several design patterns that work together to maintain modularity, extensibility, and consistency:

### Plugin Architecture
The ESLint plugin serves as the central registration point, exposing a plugin object with metadata, rule definitions, and configuration presets. This follows ESLint's standard plugin contract, allowing the system to integrate seamlessly into any ESLint-powered workflow while supporting both legacy and modern configuration systems.

### Visitor Pattern
Rules leverage ESLint's AST traversal mechanism by defining visitor functions keyed to CSS and HTML node selectors. This enables rules to declaratively specify which syntax nodes they care about rather than manually traversing the entire tree, keeping rules focused and performant.

### Strategy Pattern (Handler-Based Processing)
The hardcoded values detection system uses specialized handlers that encapsulate domain-specific validation logic for different CSS property types (colors, spacing, fonts, shadows). Each handler implements a common interface, allowing the rule factory to compose different validation strategies for different CSS properties without conditional complexity.

### Factory Pattern (Rule Generation)
A rule factory function generates complete ESLint rules from configuration objects, enabling multiple rule variants to share identical validation logic while operating against different SLDS metadata versions. This eliminates code duplication and ensures consistency across rule variants.

### Metadata-Driven Configuration
All SLDS standards (naming conventions, deprecated classes, styling hook values, color palettes) are externalized to separate metadata packages and configuration files. Rules consume this data declaratively rather than hardcoding values, ensuring that updates to SLDS standards require only metadata changes without touching rule logic.

### Adapter Pattern (Multi-Version Support)
Existing rules implement dual execution paths: one for HTML parsing and one for CSS parsing, with graceful degradation based on the available runtime environment. This adapter-based approach maintains a unified API while adapting to different ESLint versions and feature availability. **Note:** All new rules are designed exclusively for ESLint v9+ and do not require backward compatibility, simplifying implementation and leveraging modern ESLint capabilities.

### Utility Layer Abstraction
A horizontal utility layer provides reusable functions for common operations across all rules. This prevents code duplication and establishes a consistent vocabulary for parsing, validation, and transformation operations, making rules easier to write and maintain.

### Composition Over Inheritance
Rather than creating rule class hierarchies, the codebase composes functionality through handler composition, utility functions, and configuration injection. This flexible composition allows rules to combine multiple validation strategies without rigid inheritance structures.

---

## Evolution Strategy

### ESLint Version Support Policy
The project follows a forward-looking approach to ESLint version support:

- **Existing Rules**: Maintain backward compatibility with both ESLint v8 (legacy) and ESLint v9+ (flat config) to support current users.
- **New Rules**: Target ESLint v9+ exclusively, eliminating backward compatibility requirements and leveraging modern ESLint features such as native CSS parsing, improved AST APIs, and enhanced configuration capabilities.

This strategy balances stability for existing implementations with a simplified development path for future enhancements, reducing maintenance overhead while taking advantage of the latest ESLint ecosystem improvements.

---

## Summary

These architectural patterns collectively enable the codebase to remain **modular** (rules are independent and self-contained), **extensible** (new rules follow established patterns), **testable** (handlers and utilities can be tested in isolation), and **maintainable** (SLDS updates are localized to metadata files). The clear separation of concerns across modules ensures that each component has a single responsibility, making the system easier to understand, debug, and evolve.

