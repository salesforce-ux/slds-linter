import styled from 'styled-components';

const style = {
  color: 'var(--lwc-brandDark)',
} satisfies React.CSSProperties;

// Invalid and fixable: local const style objects are resolved from style={style}.
export function InlineStyleDemo() {
  return <div style={style}>Inline style</div>;
}

// Invalid and fixable: styled-components declaration values and custom-property names are checked.
export const StyledTokenDemo = styled.div`
  --lwc-brandDark: #123456;
  color: var(--lwc-brandDark);
`;
