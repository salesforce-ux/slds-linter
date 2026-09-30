import styled from 'styled-components';

const styles = {
  '--slds-c-accordion-color-border': 'currentColor',
  padding: 'var(--slds-c-button-spacing-blockstart)',
} satisfies React.CSSProperties;

// Invalid and fixable: direct inline style properties and values are checked.
export function InlineStyleDemo() {
  return <div style={{ margin: 'var(--slds-c-card-spacing-inlineend)' }}>Inline style</div>;
}

// Invalid and fixable: referenced static style objects are checked once.
export function StyleObjectDemo() {
  return <section style={styles}>Style object</section>;
}

// Not applicable: className values are class tokens, not component styling hooks.
export function ClassNameDemo() {
  return <div className="--slds-c-accordion-color-border">Class name</div>;
}

// Invalid and fixable: styled-components declaration properties and values are checked.
export const StyledHookDemo = styled.div`
  --slds-c-textarea-sizing-height-min: 6rem;
  padding: var(--slds-c-button-spacing-inlinestart);
`;
