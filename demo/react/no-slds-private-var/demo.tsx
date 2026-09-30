import styled from 'styled-components';

const property = 'color-background';

const styles = {
  '--_slds-button-color-background': 'rebeccapurple',
  color: 'var(--_slds-button-color-text)',
} satisfies React.CSSProperties;

// Invalid and fixable: static inline declaration properties are checked.
export function InlineStyleDemo() {
  return <div style={styles}>Inline style</div>;
}

// Not applicable: declaration values and className values are not checked.
export function NonDeclarationDemo() {
  return <div className="--_slds-button-color-border" style={{color: 'var(--_slds-button-color-text)'}}>Other usage</div>;
}

// Invalid and fixable: static styled-components declaration properties are checked.
export const StyledPrivateVarDemo = styled.div`
  --_slds-card-color-background: white;
  color: var(--_slds-card-color-text);
`;

// Partial support: dynamic declaration property names are ignored.
export const DynamicStyledPrivateVarDemo = styled.div`
  --_slds-card-${property}: white;
`;
