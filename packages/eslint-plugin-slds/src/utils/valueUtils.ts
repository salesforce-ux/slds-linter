import valueParser from 'postcss-value-parser';

export function isGlobalValue(value: string): boolean {
    return value === 'initial' || value === 'inherit' || value === 'unset' || value === 'revert' || value === 'revert-layer';
}

export function toAlternateUnitValue(value: string): string {
    const parsedValue = valueParser.unit(value);
    const unitType = parsedValue && parsedValue.unit;
    const numberVal = parsedValue ? Number(parsedValue.number) : 0;
    let alternateValue = null;
    if (unitType === 'px') {
      let floatValue = parseFloat(`${numberVal / 16}`);
      if (!isNaN(floatValue)) {
        alternateValue = `${parseFloat(floatValue.toFixed(4))}rem`;
      }
    } else if (unitType === 'rem') {
      const intValue = parseInt(`${numberVal * 16}`);
      if (!isNaN(intValue)) {
        alternateValue = `${intValue}px`;
      }
    }
    return alternateValue;
} 