import { Declaration } from 'postcss';
import stylelint from 'stylelint';
import generateSuggestionsList from './generateSuggestionsList';

export interface MessagesObj {
  rejected: (oldValue: string, newValue: string) => string;
  suggested: (oldValue: string) => string;
}

export function reportMatchingHooks(
  valueNode: any,
  suggestions: string[],
  offsetIndex: number,
  props: Partial<stylelint.Problem>,
  messages: MessagesObj,
  fix?: stylelint.FixCallback
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
    stylelint.utils.report(<stylelint.Problem>{
      message: JSON.stringify({
        message: messages.rejected(value, generateSuggestionsList(suggestions)),
        suggestions,
      }),
      ...reportProps,
      fix: suggestions.length === 1 ? fix : null,
    });
  } else {
    stylelint.utils.report(<stylelint.Problem>{
      message: JSON.stringify({
        message: messages.suggested(value),
        suggestions: [],
      }),
      ...reportProps,
    });
  }
} 