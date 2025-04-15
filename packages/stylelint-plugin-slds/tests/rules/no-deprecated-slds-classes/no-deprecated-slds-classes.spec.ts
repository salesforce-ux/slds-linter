import stylelint, { LinterResult, LinterOptions } from 'stylelint';
const { lint }: typeof stylelint = stylelint;

describe('slds/no-deprecated-slds-classes', () => {


  const tests = [{
    description:"Should report slds-col-rule_bottom as deprecated",
    input:'.slds-col-rule_bottom{border:0}',
    expectedMessage:'The class slds-col-rule_bottom is deprecated and not available in SLDS2. Please update to a supported class. (slds/no-deprecated-slds-classes)'
  }, {
    description:"Should not report slds-custom-created",
    input:'.slds-custom-created{border:0}'
  }]

  const testStyleLintRule = async (code:string) => {
    const linterResult: LinterResult = await lint({
      code,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          'slds/no-deprecated-slds-classes': true,
        },
      },
    } as LinterOptions);
  
    return linterResult.results[0].warnings.map((warning) => warning.text);
  };

  tests.forEach(({description, input, expectedMessage})=>{
    it(description, async ()=>{
       const messages = await testStyleLintRule(input)
       if(expectedMessage){
        expect(messages[0]).toMatch(expectedMessage);
       } else {
        expect(messages).toHaveLength(0);
       }
    })
  });

});
