import styled from 'styled-components';

const shared = {
  color: 'red',
};

// Invalid: explicit declarations are checked even when the style object contains a spread.
const style = {
  ...shared,
  '--slds-g-color-border-base-2': 'red',
  color: 'var(--slds-g-link-color)',
} satisfies React.CSSProperties;

// Invalid and not fixable: the referenced object contains unsupported hooks.
export function InlineStyleDemo() {
  return <div style={style}>Inline style</div>;
}

// Invalid and not fixable: styled-components property names and values are checked.
export const StyledHookDemo = styled.div`
  --slds-c-badge-line-height: 1;
  color: var(--slds-g-link-color-hover);
`;
