/**
 * JSON Schema for no-hardcoded-values rule options
 * Defines validation rules for reportNumericValue, customMapping, and deterministicOnly
 */
export const ruleOptionsSchema = [
  {
    type: 'object',
    properties: {
      reportNumericValue: {
        type: 'string',
        enum: ['never', 'always', 'hasReplacement'],
        default: 'always'
      },
      customMapping: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            properties: {
              type: 'array',
              items: { type: 'string' }
            },
            values: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['properties', 'values']
        }
      },
      deterministicOnly: {
        type: 'boolean',
        default: false
      }
    },
    additionalProperties: false
  }
]
