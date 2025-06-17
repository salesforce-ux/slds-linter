import valueParser from 'postcss-value-parser';

/**
 * Regex pattern for matching CSS functions.
 */
const cssFunctionsRegex =
  /^(?:attr|calc|color-mix|conic-gradient|counter|cubic-bezier|linear-gradient|max|min|radial-gradient|repeating-conic-gradient|repeating-linear-gradient|repeating-radial-gradient|var)$/;

export const forEachDensifyValue = (
  parsedValue: valueParser.ParsedValue,
  cb: valueParser.WalkCallback
) => {
  const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];
  /**
   * Using valueParser.walk() without the bubble parameter (defaults to false),
   * which means returning false in the callback prevents traversal of descendant nodes.
   * See: https://www.npmjs.com/package/postcss-value-parser#valueparserwalknodes-callback-bubble
   */
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      if (node.type === 'function' && cssFunctionsRegex.test(node.value)) {
        // Skip CSS functions as they often contain necessary hardcoded values
        // that are part of their syntax (e.g., calc(100% - 20px))
        return false;
      }
      const parsedValue = valueParser.unit(node.value);
      if (node.type !== 'word' || !parsedValue) {
        // Consider only node of type word and parsable by unit function
        return;
      } else if (
        parsedValue.unit &&
        !ALLOWED_UNITS.includes(parsedValue.unit)
      ) {
        // If unit exists make sure its in allowed list
        return;
      } else if (isNaN(Number(parsedValue.number))) {
        // Consider only valid numeric values
        return;
      } else if (Number(parsedValue.number) === 0) {
        // Do not report zero value
        return;
      }
      cb(node, index, nodes);
    }
  );
}; 