import styled from 'styled-components';

// Valid: applying an SLDS class does not override its CSS definition.
export function ClassNameDemo() {
  return <button className="slds-button">Button</button>;
}

// Valid: inline declarations have no class selector to override.
export function InlineStyleDemo() {
  return <button style={{ color: '#8e030f' }}>Button</button>;
}

// Invalid: this styled-components selector overrides an existing SLDS class.
export const StyledOverrideDemo = styled.button`
  &.slds-button {
    color: #8e030f;
  }
`;

// Valid: a custom class after the SLDS class scopes the customization.
export const ScopedStyledDemo = styled.button`
  &.slds-button.my-button {
    color: #8e030f;
  }
`;
