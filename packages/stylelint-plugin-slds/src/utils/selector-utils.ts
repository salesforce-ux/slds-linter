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

export function getClassNodesAtEnd(selector: string): CssClassNode[] {
  const selectorParser = SelectorParser();
  const selectorAst = selectorParser.astSync(selector);
  const classNodes:CssClassNode[] = [];
  for (const node of selectorAst.nodes) {
      if(node.type === 'selector'){
          let lastNode = node.last?.type === 'pseudo' ? node.last?.prev() : node.last;
          if(lastNode?.type === 'class'){
            classNodes.push(lastNode);
          }
      }
  }
  return classNodes;
}
