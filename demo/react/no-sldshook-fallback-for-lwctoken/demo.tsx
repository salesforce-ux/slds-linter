import styled from 'styled-components';

const style = {
  color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))',
} satisfies React.CSSProperties;

// Valid: this spread source contains no LWC-to-SLDS fallback relationship.
const baseStyle = {
  padding: '1rem',
} satisfies React.CSSProperties;

// Invalid: an SLDS hook cannot be the fallback for an LWC token.
export function InlineFallbackDemo() {
  return (
    <>
      <div style={style}>Referenced style object</div>
      <div
        style={{
          ...baseStyle,
          background: 'var(--lwc-brandDark, var(--slds-g-color-accent-1))',
        }}
      >
        Spread with an explicit style
      </div>
    </>
  );
}

// Invalid: styled-components declaration values are checked.
export const StyledFallbackDemo = styled.div`
  color: var(--lwc-colorBackground, var(--slds-g-color-border-1));
`;
