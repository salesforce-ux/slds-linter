import { PostcssResult } from "stylelint";

export function isRuleEnabled(result: PostcssResult, ruleName: string) {
    const rules:any = result?.stylelint?.config?.rules || {};
    if(ruleName in rules){
        if(Array.isArray(rules[ruleName])){
            return rules[ruleName][0] === true;
        } else if(rules[ruleName] !== undefined && rules[ruleName] !== null){
            return true;
        } else if(rules[ruleName] === false){
            return false;
        }
    }
}