import type { Linter } from 'eslint';

export enum Persona {
    INTERNAL = 'internal',
    EXTERNAL = 'external'
}

export type PersonaType = Persona.INTERNAL | Persona.EXTERNAL;

export type RuleSeverity = 'warning' | 'error' | "off";
export type RULE_TO_PERSONA_MAP_ENTRY = {
    targetPersona: PersonaType[],
    severity: RuleSeverity
};

const STYLELINT_RULE_TO_PERSONA_MAP: Record<string, RULE_TO_PERSONA_MAP_ENTRY> = {
    "slds/no-slds-class-overrides": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-important-tag": {
        targetPersona: [],
        severity: 'warning'
    },
    "slds/no-hardcoded-values-slds1": {
        targetPersona: [Persona.INTERNAL],
        severity: 'error'
    },
    "slds/no-hardcoded-values-slds2": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-deprecated-tokens-slds1": {
        targetPersona: [Persona.INTERNAL],
        severity: 'error'
    },
    "slds/lwc-token-to-slds-hook": {
        targetPersona: [Persona.INTERNAL],
        severity: 'warning'
    },
    "slds/enforce-bem-usage": {
        targetPersona: [Persona.INTERNAL],
        severity: 'warning'
    },
    "slds/no-slds-private-var": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-calc-function": {
        targetPersona: [],
        severity: 'warning'
    },
    "slds/reduce-annotations": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-unsupported-hooks-slds2": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-slds-var-without-fallback": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-slds-namespace-for-custom-hooks": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/no-sldshook-fallback-for-lwctoken": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'warning'
    },
    "slds/enforce-component-hook-naming-convention": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'error'
    }
};


const ESLINT_RULE_TO_PERSONA_MAP: Record<string, RULE_TO_PERSONA_MAP_ENTRY> = {
    "@salesforce-ux/slds/enforce-bem-usage": {
        targetPersona: [Persona.INTERNAL],
        severity: 'error'
    },
    "@salesforce-ux/slds/no-deprecated-classes-slds2": {
        targetPersona: [Persona.INTERNAL],
        severity: 'error'
    },
    "@salesforce-ux/slds/modal-close-button-issue": {
        targetPersona: [Persona.INTERNAL, Persona.EXTERNAL],
        severity: 'error'
    }
}

export function getStylelintRulesForPersona(persona: PersonaType): Record<string, [boolean, {severity: RuleSeverity}]> {
    const rules = {};
    for(const [key, val] of Object.entries(STYLELINT_RULE_TO_PERSONA_MAP)){
        if(val.targetPersona.includes(persona)){
            rules[key] = [true, {severity: val.severity}];
        }
    }
    return rules;
}

export function getEslintRulesForPersona(persona: PersonaType): Linter.RulesRecord {
    const rules = {};
    for(const [key, val] of Object.entries(ESLINT_RULE_TO_PERSONA_MAP)){
        rules[key] = val.targetPersona.includes(persona)?val.severity:'off';
    }
    return rules;
}

export function canExecuteRule(ruleId: string, persona: PersonaType): boolean {
    const rule = ESLINT_RULE_TO_PERSONA_MAP[ruleId];
    return rule?.targetPersona.includes(persona) || false;
}