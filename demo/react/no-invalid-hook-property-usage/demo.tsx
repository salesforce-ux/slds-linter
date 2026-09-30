import styled from 'styled-components';

const styles = {
  backgroundColor: 'var(--slds-g-color-error-container-2)',
  color: 'var(--slds-g-color-error-container-2)',
  fontSize: 'var(--slds-g-spacing-1)',
} satisfies React.CSSProperties;

// Partial inline support: known global hooks are validated against normalized properties.
export function InlineHookPropertyDemo() {
  return <div style={styles}>Inline hook properties</div>;
}

// Partial styled-components support: declarations in nested rules are validated.
export const StyledHookPropertyDemo = styled.div`
  background-color: var(--slds-g-color-error-container-2);
  color: var(--slds-g-spacing-1);

  &:hover {
    font-size: var(--slds-g-spacing-1);
  }
`;

// Static hook names remain checkable when only the fallback is dynamic.
export const DynamicFallbackDemo = styled.div`
  color: var(--slds-g-spacing-1, ${props => props.$fallback});
`;
