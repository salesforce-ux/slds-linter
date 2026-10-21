import styled from 'styled-components';

const style = {
  '--sds-g-spacing-1': '4px',
  color: 'var(--sds-g-color-palette-blue-10)',
} satisfies React.CSSProperties;

// Invalid and fixable: referenced inline declarations use replaceable SDS hooks.
export function InlineStyleDemo() {
  return <div style={style}>Inline style</div>;
}

// Invalid and fixable: styled-components property names and values are checked.
export const StyledHookDemo = styled.div`
  --sds-c-button-color-background: red;
  padding: var(--sds-g-spacing-2);
`;
