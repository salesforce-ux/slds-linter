const {
  findAttr,
  isAttributesEmpty,
  isNodeTokensOnSameLine,
  isRangesOverlap,
  isOverlapWithTemplates,
  splitToLineNodes,
  getLocBetween,
  isExpressionInTemplate,
  isTag,
  isComment,
  isText,
  codeToLines,
  getTemplateTokens
} = require('../../src/utils/node');

describe('node utils', () => {
  describe('findAttr', () => {
    it('should find attribute by key (case insensitive)', () => {
      const node = {
        attributes: [
          { key: { value: 'class' }, value: { value: 'test' } },
          { key: { value: 'id' }, value: { value: 'myId' } }
        ]
      };
      expect(findAttr(node, 'class')).toEqual({ key: { value: 'class' }, value: { value: 'test' } });
      expect(findAttr(node, 'CLASS')).toEqual({ key: { value: 'class' }, value: { value: 'test' } });
      expect(findAttr(node, 'id')).toEqual({ key: { value: 'id' }, value: { value: 'myId' } });
    });

    it('should return undefined when attribute not found', () => {
      const node = {
        attributes: [
          { key: { value: 'class' }, value: { value: 'test' } }
        ]
      };
      expect(findAttr(node, 'data-test')).toBeUndefined();
    });

    it('should handle empty attributes array', () => {
      const node = { attributes: [] };
      expect(findAttr(node, 'class')).toBeUndefined();
    });
  });

  describe('isAttributesEmpty', () => {
    it('should return true when attributes is empty', () => {
      const node = { attributes: [] };
      expect(isAttributesEmpty(node)).toBe(true);
    });

    it('should return true when attributes is undefined', () => {
      const node = {};
      expect(isAttributesEmpty(node)).toBe(true);
    });

    it('should return true when attributes length is 0', () => {
      const node = { attributes: [] };
      expect(isAttributesEmpty(node)).toBe(true);
    });

    it('should return false when attributes has items', () => {
      const node = {
        attributes: [
          { key: { value: 'class' }, value: { value: 'test' } }
        ]
      };
      expect(isAttributesEmpty(node)).toBe(false);
    });
  });

  describe('isNodeTokensOnSameLine', () => {
    it('should return true when start and end are on same line', () => {
      const node = {
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 }
        }
      };
      expect(isNodeTokensOnSameLine(node)).toBe(true);
    });

    it('should return false when start and end are on different lines', () => {
      const node = {
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 2, column: 0 }
        }
      };
      expect(isNodeTokensOnSameLine(node)).toBe(false);
    });
  });

  describe('isRangesOverlap', () => {
    it('should return true when ranges overlap', () => {
      expect(isRangesOverlap([0, 10], [5, 15])).toBe(true);
      expect(isRangesOverlap([5, 15], [0, 10])).toBe(true);
      expect(isRangesOverlap([0, 10], [10, 20])).toBe(false); // Adjacent, not overlapping
    });

    it('should return false when ranges do not overlap', () => {
      expect(isRangesOverlap([0, 5], [10, 15])).toBe(false);
      expect(isRangesOverlap([10, 15], [0, 5])).toBe(false);
    });
  });

  describe('isOverlapWithTemplates', () => {
    it('should return true when range overlaps with template', () => {
      const templates = [
        { isTemplate: true, range: [5, 15] },
        { isTemplate: false, range: [20, 30] }
      ];
      expect(isOverlapWithTemplates(templates, [10, 20])).toBe(true);
    });

    it('should return false when range does not overlap with templates', () => {
      const templates = [
        { isTemplate: true, range: [5, 15] },
        { isTemplate: false, range: [20, 30] }
      ];
      expect(isOverlapWithTemplates(templates, [0, 4])).toBe(false);
      expect(isOverlapWithTemplates(templates, [16, 19])).toBe(false);
    });

    it('should filter out non-template entries', () => {
      const templates = [
        { isTemplate: false, range: [5, 15] }
      ];
      expect(isOverlapWithTemplates(templates, [10, 20])).toBe(false);
    });
  });

  describe('splitToLineNodes', () => {
    it('should split text node into line nodes', () => {
      const node = {
        value: 'line1\nline2\nline3',
        range: [0, 18],
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 3, column: 6 }
        },
        templates: []
      };
      const result = splitToLineNodes(node);
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe('line1');
      expect(result[1].value).toBe('line2');
      expect(result[2].value).toBe('line3');
    });

    it('should handle single line', () => {
      const node = {
        value: 'single line',
        range: [0, 11],
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 11 }
        },
        templates: []
      };
      const result = splitToLineNodes(node);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('single line');
    });

    it('should handle templates in value', () => {
      const node = {
        value: 'line1\nline2',
        range: [0, 12],
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 2, column: 6 }
        },
        templates: [
          { isTemplate: true, range: [0, 5] }
        ]
      };
      const result = splitToLineNodes(node);
      expect(result).toHaveLength(2);
    });
  });

  describe('getLocBetween', () => {
    it('should return location between two nodes', () => {
      const before = {
        loc: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 }
        }
      };
      const after = {
        loc: {
          start: { line: 1, column: 20 },
          end: { line: 1, column: 30 }
        }
      };
      const result = getLocBetween(before, after);
      expect(result.start).toEqual({ line: 1, column: 10 });
      expect(result.end).toEqual({ line: 1, column: 20 });
    });
  });

  describe('isExpressionInTemplate', () => {
    it('should return true for AttributeValue starting with ${', () => {
      const node = {
        type: 'AttributeValue',
        value: '${expression}'
      };
      expect(isExpressionInTemplate(node)).toBe(true);
    });

    it('should return false for AttributeValue not starting with ${', () => {
      const node = {
        type: 'AttributeValue',
        value: 'regular value'
      };
      expect(isExpressionInTemplate(node)).toBe(false);
    });

    it('should return false for non-AttributeValue node', () => {
      const node = {
        type: 'Text',
        value: '${expression}'
      };
      expect(isExpressionInTemplate(node)).toBe(false);
    });
  });

  describe('isTag', () => {
    it('should return true for Tag node type', () => {
      const node = { type: 'Tag' };
      expect(isTag(node)).toBe(true);
    });

    it('should return false for non-Tag node types', () => {
      expect(isTag({ type: 'Text' })).toBe(false);
      expect(isTag({ type: 'Comment' })).toBe(false);
    });
  });

  describe('isComment', () => {
    it('should return true for Comment node type', () => {
      const node = { type: 'Comment' };
      expect(isComment(node)).toBe(true);
    });

    it('should return false for non-Comment node types', () => {
      expect(isComment({ type: 'Tag' })).toBe(false);
      expect(isComment({ type: 'Text' })).toBe(false);
    });
  });

  describe('isText', () => {
    it('should return true for Text node type', () => {
      const node = { type: 'Text' };
      expect(isText(node)).toBe(true);
    });

    it('should return false for non-Text node types', () => {
      expect(isText({ type: 'Tag' })).toBe(false);
      expect(isText({ type: 'Comment' })).toBe(false);
    });
  });

  describe('codeToLines', () => {
    it('should split code by line breaks', () => {
      const result = codeToLines('line1\nline2\nline3');
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('should handle different line ending types', () => {
      expect(codeToLines('line1\r\nline2')).toEqual(['line1', 'line2']);
      expect(codeToLines('line1\rline2')).toEqual(['line1', 'line2']);
    });

    it('should handle empty string', () => {
      expect(codeToLines('')).toEqual(['']);
    });
  });

  describe('getTemplateTokens', () => {
    it('should extract template tokens from tokens array', () => {
      const tokens = [
        { templates: [{ isTemplate: true, range: [0, 10] }] },
        { templates: [{ isTemplate: true, range: [20, 30] }] },
        { templates: [{ isTemplate: false, range: [40, 50] }] }
      ];
      const result = getTemplateTokens(tokens);
      expect(result).toHaveLength(2);
      expect(result[0].isTemplate).toBe(true);
      expect(result[1].isTemplate).toBe(true);
    });

    it('should filter out non-template tokens', () => {
      const tokens = [
        { templates: [{ isTemplate: false, range: [0, 10] }] }
      ];
      const result = getTemplateTokens(tokens);
      expect(result).toHaveLength(0);
    });

    it('should handle tokens without templates property', () => {
      const tokens = [
        { type: 'Text' },
        { templates: [{ isTemplate: true, range: [0, 10] }] }
      ];
      const result = getTemplateTokens(tokens);
      expect(result).toHaveLength(1);
    });

    it('should handle empty tokens array', () => {
      expect(getTemplateTokens([])).toEqual([]);
    });
  });
});

