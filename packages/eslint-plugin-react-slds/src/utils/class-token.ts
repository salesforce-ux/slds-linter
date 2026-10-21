import type { TSESTree } from '@typescript-eslint/utils';

export type ClassToken = {
  node: TSESTree.Node;
  name: string;
  range: [number, number];
};

export type ClassTokenVisitor = (token: ClassToken) => void;
