// Test utility for v9 ESLint rule tests

/**
 * Runs a rule's Declaration visitor on a simulated CSS property/value pair.
 * @param {object} rule - The ESLint rule (should have a .create method).
 * @param {string} cssProperty - The CSS property name.
 * @param {string} cssValue - The CSS value.
 * @param {string} [filename='test.css'] - The filename to simulate.
 * @returns {Array} Array of report objects.
 */
function runRuleOnDecl(rule, cssProperty, cssValue, filename = 'test.css') {
  const reports = [];
  const context = {
    filename,
    sourceCode: {
      text: `${cssProperty}: ${cssValue};`,
    },
    report: (obj) => reports.push(obj),
  };
  const node = {
    property: cssProperty,
    value: {
      range: [cssProperty.length + 2, cssProperty.length + 2 + cssValue.length],
    },
    range: [0, cssProperty.length + 2 + cssValue.length + 1],
  };
  const visitors = rule.create(context);
  if (visitors.Declaration) {
    visitors.Declaration(node);
  }
  return reports;
}

module.exports = {
  runRuleOnDecl,
}; 