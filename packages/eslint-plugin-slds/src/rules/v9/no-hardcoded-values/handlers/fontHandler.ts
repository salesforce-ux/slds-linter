import type { HandlerContext, DeclarationHandler } from '../../../../utils/types';

/**
 * Handle font shorthand - simplified font parsing
 * For now, skip font shorthand as it's complex
 * Individual font-size and font-weight are handled by CSS AST selectors
 */
export const handleFontShorthand: DeclarationHandler = (node: any, context: HandlerContext) => {
  // For now, skip font shorthand as it's complex
  // Individual font-size and font-weight are handled by density handler
  return;
};
