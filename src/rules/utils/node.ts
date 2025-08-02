// HTML AST utility functions for ESLint rules
// Compatible with both ESLint v8 and v9

/**
 * Find an attribute by key in a HTML node
 * @param {TagNode | ScriptTagNode | StyleTagNode} node
 * @param {string} key
 * @returns {AttributeNode | undefined}
 */
function findAttr(node, key) {
  return node.attributes.find(
    (attr) => attr.key && attr.key.value.toLowerCase() === key.toLowerCase()
  );
}

/**
 * Checks whether a node's attributes is empty or not
 * @param {TagNode | ScriptTagNode | StyleTagNode} node
 * @returns {boolean}
 */
function isAttributesEmpty(node) {
  return !node.attributes || node.attributes.length <= 0;
}

export {
  findAttr,
  isAttributesEmpty,
}; 