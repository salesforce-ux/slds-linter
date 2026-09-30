import styled from 'styled-components';

const tone = 'accent';
const styles = {
  backgroundColor: '#001639',
  padding: '0.25rem',
  width: 16,
} satisfies React.CSSProperties;

// Partial inline support: static CSS strings are checked; numeric JSX values are ignored.
export function InlineHardcodedValueDemo() {
  return <div style={styles}>Inline values</div>;
}

// Partial inline support: static template fragments are reported without unsafe fixes.
export function MixedInlineValueDemo() {
  return <div style={{color: `#001639 ${tone} #001639`}}>Mixed inline value</div>;
}

// Partial styled-components support: static declarations and nested rules are checked.
export const StyledHardcodedValueDemo = styled.div`
  color: #001639;
  &:hover {
    padding: 0.25rem;
  }
`;

// Partial styled-components support: values touching interpolations are not fixed.
export const MixedStyledHardcodedValueDemo = styled.div`
  border-color: #001639 ${props => props.$tone} #001639;
`;
