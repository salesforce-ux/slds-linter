import styled from 'styled-components';

// Valid: custom namespaces and known reserved hooks are supported.
const shared = {
  '--myapp-color': 'red',
  color: 'var(--slds-g-color-brand-base-50)',
};

// Invalid and not fixable: explicit keys and values are checked beside spreads.
const style = {
  ...shared,
  '--slds-custom-color': 'var(--sds-custom-background)',
} satisfies React.CSSProperties;

// Invalid and not fixable: referenced static style objects are checked.
export function InlineStyleDemo() {
  return <div style={style}>Inline style</div>;
}

// Invalid and not fixable: styled-components properties and values are checked.
export const StyledHookDemo = styled.div`
  --slds-custom-spacing: 1rem;
  color: var(--sds-custom-text);
  border: var(--slds-static-name, ${props => props.color});
`;

// Valid: interpolation-adjacent property names are skipped; no diagnostic or fix applies.
export const DynamicStyledHookDemo = styled.div`
  ${props => props.prefix}--slds-dynamic-property: red;
`;
