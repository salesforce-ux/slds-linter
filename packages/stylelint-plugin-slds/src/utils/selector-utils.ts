import SelectorParser from 'postcss-selector-parser';

interface CssClassNode{
  value:string,
  sourceIndex: number
}

export function getClassNodesFromSelector(selector: string): CssClassNode[] {
  const selectorParser = SelectorParser();
  const selectorAst = selectorParser.astSync(selector);
  const classNodes = [];
  selectorAst.walkClasses((classNode) => {
    classNodes.push(classNode);
  });
  return classNodes;
}
