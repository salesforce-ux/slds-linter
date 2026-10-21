import styled from 'styled-components';

const style = {
  color: 'var(--slds-g-color-border-base-1)',
} satisfies React.CSSProperties;

// Valid: this SLDS variable already provides a fallback.
const baseStyle = {
  padding: 'var(--slds-g-spacing-4, 1rem)',
} satisfies React.CSSProperties;

// Invalid and fixable: referenced and explicit spread-sibling values lack fallbacks.
export function InlineFallbackDemo() {
  return (
    <>
      <div style={style}>Referenced style object</div>
      <div style={{...baseStyle, borderColor: 'var(--slds-g-color-border-base-2)'}}>
        Spread with an explicit style
      </div>
    </>
  );
}

// Invalid and fixable: the styled-components variable lacks a fallback.
export const StyledFallbackDemo = styled.div`
  color: var(--slds-g-color-border-base-3);
`;
