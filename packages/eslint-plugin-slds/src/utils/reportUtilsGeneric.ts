import generateSuggestionsList from './generateSuggestionsList';

export interface GenericMessagesObj {
  rejected: (oldValue: string, newValue: string) => string;
  suggested: (oldValue: string) => string;
}

export function makeReportMatchingHooks(reportFn: Function) {
  return function reportMatchingHooks(
    valueNode: any,
    suggestions: string[],
    offsetIndex: number,
    props: Partial<any>,
    messages: GenericMessagesObj,
    fix?: Function
  ) {
    let index = offsetIndex;
    const value = valueNode.value;
    let endIndex = offsetIndex + valueNode.value.length;
    const node = valueNode as any;
    if ('sourceIndex' in valueNode && 'sourceEndIndex' in valueNode) {
      index = valueNode.sourceIndex + offsetIndex;
      endIndex = valueNode.sourceEndIndex + offsetIndex;
    }
    const reportProps = {
      node,
      index,
      endIndex,
      ...props,
    };
    if (suggestions.length > 0) {
      reportFn({
        message: JSON.stringify({
          message: messages.rejected(value, generateSuggestionsList(suggestions)),
          suggestions,
        }),
        ...reportProps,
        fix: suggestions.length === 1 ? fix : null,
      });
    } else {
      reportFn({
        message: JSON.stringify({
          message: messages.suggested(value),
          suggestions: [],
        }),
        ...reportProps,
      });
    }
  }
} 