import { parseBoxShadowValue } from '../../src/utils/boxShadowValueParser';

describe('boxShadowValueParser', () => {
    describe('parseBoxShadow', () => {
        it('should parse empty value', () => {
            const result = parseBoxShadowValue('');
            expect(result).toEqual([]);
        });

        it('should parse single shadow with offset only', () => {
            const result = parseBoxShadowValue('10px 20px');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                },
            ]);
        });

        it('should parse single shadow with offset and blur', () => {
            const result = parseBoxShadowValue('10px 20px 5px');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                    blurRadius: '5px',
                },
            ]);
        });

        it('should parse single shadow with offset, blur, and spread', () => {
            const result = parseBoxShadowValue('10px 20px 5px 2px');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                    blurRadius: '5px',
                    spreadRadius: '2px',
                },
            ]);
        });

        it('should parse single shadow with color', () => {
            const result = parseBoxShadowValue('10px 20px 5px #000');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                    blurRadius: '5px',
                    color: '#000',
                },
            ]);
        });

        it('should parse single shadow with inset keyword', () => {
            const result = parseBoxShadowValue('inset 10px 20px 5px #000');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                    blurRadius: '5px',
                    color: '#000',
                    inset: true,
                },
            ]);
        });

        it('should parse single shadow with inset keyword at the end', () => {
            const result = parseBoxShadowValue('10px 20px 5px #000 inset');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                    blurRadius: '5px',
                    color: '#000',
                    inset: true,
                },
            ]);
        });

        it('should parse multiple shadows', () => {
            const result = parseBoxShadowValue('10px 20px 5px #000, inset 5px 10px 3px #fff');
            expect(result).toEqual([
                {
                    offsetX: '10px',
                    offsetY: '20px',
                    blurRadius: '5px',
                    color: '#000',
                },
                {
                    offsetX: '5px',
                    offsetY: '10px',
                    blurRadius: '3px',
                    color: '#fff',
                    inset: true,
                },
            ]);
        });

        it('should parse shadows with different units', () => {
            const result = parseBoxShadowValue('1em 2rem 0.5em rgba(0,0,0,0.5)');
            expect(result).toEqual([
                {
                    offsetX: '1em',
                    offsetY: '2rem',
                    blurRadius: '0.5em',
                    color: 'rgba(0,0,0,0.5)',
                },
            ]);
        });

        it('should parse shadows with CSS variables', () => {
            const result = parseBoxShadowValue('var(--slds-g-spacing-x-small) var(--slds-g-spacing-small) var(--slds-g-spacing-medium) var(--slds-g-color-background-alt-1)');
            expect(result).toEqual([
                {
                    offsetX: 'var(--slds-g-spacing-x-small)',
                    offsetY: 'var(--slds-g-spacing-small)',
                    blurRadius: 'var(--slds-g-spacing-medium)',
                    color: 'var(--slds-g-color-background-alt-1)',
                },
            ]);
        });

        it('should parse shadows with CSS functions', () => {
            const result = parseBoxShadowValue('calc(10px + 5px) calc(20px - 2px) min(5px, 3px) rgba(0,0,0,0.5)');
            expect(result).toEqual([
                {
                    offsetX: 'calc(10px + 5px)',
                    offsetY: 'calc(20px - 2px)',
                    blurRadius: 'min(5px, 3px)',
                    color: 'rgba(0,0,0,0.5)',
                },
            ]);
        });

        it('should parse shadows with mixed CSS variables and functions', () => {
            const result = parseBoxShadowValue('var(--slds-g-spacing-x-small) calc(20px - var(--slds-g-spacing-small)) var(--slds-g-spacing-medium) var(--slds-g-color-background-alt-1)');
            expect(result).toEqual([
                {
                    offsetX: 'var(--slds-g-spacing-x-small)',
                    offsetY: 'calc(20px - var(--slds-g-spacing-small))',
                    blurRadius: 'var(--slds-g-spacing-medium)',
                    color: 'var(--slds-g-color-background-alt-1)',
                },
            ]);
        });

        it('should parse shadows with zero values', () => {
            const result = parseBoxShadowValue('0 0 10px rgba(0,0,0,0.3)');
            expect(result).toEqual([
                {
                    offsetX: '0',
                    offsetY: '0',
                    blurRadius: '10px',
                    color: 'rgba(0,0,0,0.3)',
                },
            ]);
        });

        it('should parse shadows with negative values', () => {
            const result = parseBoxShadowValue('-5px -10px 15px #333');
            expect(result).toEqual([
                {
                    offsetX: '-5px',
                    offsetY: '-10px',
                    blurRadius: '15px',
                    color: '#333',
                },
            ]);
        });

        it('should parse shadows with named colors', () => {
            const result = parseBoxShadowValue('5px 10px 20px red');
            expect(result).toEqual([
                {
                    offsetX: '5px',
                    offsetY: '10px',
                    blurRadius: '20px',
                    color: 'red',
                },
            ]);
        });

        it('should parse shadows with hsl colors', () => {
            const result = parseBoxShadowValue('5px 10px 20px hsl(0, 100%, 50%)');
            expect(result).toEqual([
                {
                    offsetX: '5px',
                    offsetY: '10px',
                    blurRadius: '20px',
                    color: 'hsl(0, 100%, 50%)',
                },
            ]);
        });

        it('should handle complex multiple shadows', () => {
            const result = parseBoxShadowValue(
                '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.1)'
            );
            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                offsetX: '0',
                offsetY: '1px',
                blurRadius: '3px',
                color: 'rgba(0,0,0,0.12)',
            });
            expect(result[1]).toEqual({
                offsetX: '0',
                offsetY: '1px',
                blurRadius: '2px',
                color: 'rgba(0,0,0,0.24)',
            });
            expect(result[2]).toEqual({
                offsetX: '0',
                offsetY: '1px',
                blurRadius: '0',
                color: 'rgba(255,255,255,0.1)',
                inset: true,
            });
        });

        it('should parse styling hook used for box-shadow', () => {
            const result = parseBoxShadowValue('var(--sds-c-card-shadow, var(--lwc-cardShadow,none))');
            expect(result).toEqual([{}]);
        });

        it('should parse named colors', () => {
            const result = parseBoxShadowValue('1px 2px 2px lightgrey');
            expect(result).toEqual([
                {
                    offsetX: '1px',
                    offsetY: '2px',
                    blurRadius: '2px',
                    color: 'lightgrey',
                },
            ]);
        });
    });

}); 