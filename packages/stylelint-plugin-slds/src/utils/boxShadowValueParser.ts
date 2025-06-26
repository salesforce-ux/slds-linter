import valueParser from 'postcss-value-parser';
import { isValidColor } from './color-lib-utils';
import { isCommaDivision, isSpaceDivision, isInsetKeyword, getVarToken, isFunctionNode, isMathFunction } from './decl-utils';
import { isDensifyValue, normalizeLengthValue } from './density-utils';

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
    const shadows: ShadowParts[] = []
    const nodesCount = nodes.length - 1;
    let shadowParts: ShadowParts;

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
            shadows.push(shadowParts);
            shadowParts = undefined;
        }
    })
    return shadows;
}

export function parseBoxShadowValue(value: string): BoxShadowValue[] {
    const parsed = valueParser(value);
    const shadows: ShadowParts[] = extractShadowParts(parsed.nodes);

    return shadows.map((shadow) => {
        /**
         * Two, three, or four <length> values.
            If only two values are given, they are interpreted as <offset-x> and <offset-y> values.
            If a third value is given, it is interpreted as a <blur-radius>.
            If a fourth value is given, it is interpreted as a <spread-radius>.
            Optionally, the inset keyword.
            Optionally, a <color> value.
         */
        const shadowValue: BoxShadowValue = {};
        ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'].forEach((key, index) => {
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
    // If the number of shadows doesn't match, they're not equal
    if (parsedCssValue.length !== parsedValueHook.length) {
        return false;
    }

    // Compare each shadow in the array
    for (let i = 0; i < parsedCssValue.length; i++) {
        const cssShadow = parsedCssValue[i];
        const hookShadow = parsedValueHook[i];

        if(cssShadow.color !== hookShadow.color ||
            cssShadow.inset !== hookShadow.inset){
            return false;
        }

        // Compare length properties using a loop
        const lengthProps = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const;
        for (const prop of lengthProps) {
            if (normalizeLengthValue(cssShadow[prop]) !== normalizeLengthValue(hookShadow[prop])) {
                return false;
            }
        }
    }

    return true;
}