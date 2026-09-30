import styled from 'styled-components';

// Not applicable: className values are class names, not CSS declaration values.
export function ClassNameDemo() {
  return <div className="token(account)">Class name</div>;
}

// Invalid and fixable: static inline style values can contain Aura token functions.
export function InlineStyleDemo() {
  return <div style={{ color: 'token(account)' }}>Inline style</div>;
}

// Invalid and fixable: static styled-components declarations are checked.
export const StyledTokenDemo = styled.div`
  color: token(brandPrimary);
`;

// Not reported: dynamically constructed token names cannot be resolved safely.
export const DynamicStyledTokenDemo = styled.div<{ $tokenName: string }>`
  color: token(${({ $tokenName }) => $tokenName});
`;
