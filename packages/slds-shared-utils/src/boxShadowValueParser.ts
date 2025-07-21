import valueParser from 'postcss-value-parser';
import { isValidColor } from './colorLibUtils';
import { isCommaDivision, isSpaceDivision, isInsetKeyword, getVarToken, isFunctionNode, isMathFunction } from './declUtils';
import { isDensifyValue, normalizeLengthValue } from './densityUtils';

export interface BoxShadowValue {
    offsetX?: string;
    offsetY?: string;
    blurRadius?: string;
    spreadRadius?: string;
    color?: string;
    inset?: boolean;
}

interface ShadowParts {
    lengthParts: string[];
    colorParts: string[];
    inset: boolean;
}

function isColorValue(node: valueParser.Node): boolean {
    return isValidColor(valueParser.stringify(node)) || !!getVarToken(node).match(/^--slds-g-color/);
}

function isLengthValue(node: valueParser.Node): boolean {
    return isDensifyValue(node, false) || !!getVarToken(node).match(/^--slds-g-(spacing|sizing)/) || isMathFunction(node);
}

function extractShadowParts(nodes: valueParser.Node[]): ShadowParts[] {
    const shadows: ShadowParts[] = [];
    const nodesCount = nodes.length - 1;
    let shadowParts: ShadowParts | undefined;

    nodes.forEach((node, index) => {  
        shadowParts = shadowParts || {
            lengthParts: [],
            colorParts: [],
            inset: false
        };

        if (isSpaceDivision(node)) {
            //do nothing
        } else if (isLengthValue(node)) {
            shadowParts.lengthParts.push(valueParser.stringify(node));
        } else if (isColorValue(node)) {
            shadowParts.colorParts.push(valueParser.stringify(node));
        } else if (isInsetKeyword(node)) {
            shadowParts.inset = true;
        } 
        // exit condition
        if(index === nodesCount || isCommaDivision(node)){
            if (shadowParts) shadows.push(shadowParts);
            shadowParts = undefined;
        }
    })
    return shadows;
}

export function parseBoxShadowValue(value: string): BoxShadowValue[] {
    const parsed = valueParser(value);
    const shadows: ShadowParts[] = extractShadowParts(parsed.nodes);

    return shadows.map((shadow) => {
        const shadowValue: BoxShadowValue = {};
        (['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const).forEach((key, index) => {
            if(shadow.lengthParts.length > index){
                shadowValue[key] = shadow.lengthParts[index];
            }
        });
        if(shadow.colorParts.length > 0){
            shadowValue.color = shadow.colorParts[0];
        }
        if(shadow.inset){
            shadowValue.inset = shadow.inset;
        }
        return shadowValue;
    })
}

export function isBoxShadowMatch(parsedCssValue: BoxShadowValue[], parsedValueHook: BoxShadowValue[]): boolean {
    if (parsedCssValue.length !== parsedValueHook.length) {
        return false;
    }
    for (let i = 0; i < parsedCssValue.length; i++) {
        const cssShadow = parsedCssValue[i];
        const hookShadow = parsedValueHook[i];
        if(cssShadow.color !== hookShadow.color ||
            cssShadow.inset !== hookShadow.inset){
            return false;
        }
        const lengthProps: (keyof BoxShadowValue)[] = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'];
        for (const prop of lengthProps) {
            const cssVal = typeof cssShadow[prop] === 'string' ? cssShadow[prop] as string : undefined;
            const hookVal = typeof hookShadow[prop] === 'string' ? hookShadow[prop] as string : undefined;
            if (normalizeLengthValue(cssVal) !== normalizeLengthValue(hookVal)) {
                return false;
            }
        }
    }
    return true;
} 