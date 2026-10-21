import styled from 'styled-components';

// Detected: legacy double-dash BEM modifiers in className use a single underscore.
export function LegacyBemDemo() {
  return (
    <main className="slds-container--medium slds-p-around--medium">
      <section className="slds-border--bottom slds-card">
        Legacy BEM classes
      </section>
    </main>
  );
}

// Detected: static tokens are also checked inside className template literals.
export function TemplateBemDemo({ className }: { className?: string }) {
  return <div className={`slds-container--medium ${className ?? ''}`}>Template class</div>;
}

// Not applicable: inline styles contain CSS declarations, not class names.
export function InlineStyleDemo() {
  return <div style={{ color: '#0176d3' }}>No class name to inspect</div>;
}

// Detected: static class selectors in styled-components are checked.
export const LegacyBemStyledComponent = styled.div`
  &.slds-container--medium {
    display: block;
  }
`;

// Valid: current SLDS BEM classes are not reported.
export function ValidBemDemo() {
  return <div className="slds-container_medium slds-p-around_medium">Valid BEM classes</div>;
}
