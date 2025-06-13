const rule = require("./../../src/rules/modal-close-button-issue");
const {messages} = require("./../../src/rules/utils/rule")
const { RuleTester } = require("eslint");

function normalizeHTML(html) {
  return html.replace(/\s+/g, ' ').trim();
}

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@html-eslint/parser"), // Specify the parser for HTML files using flat config format
    ecmaVersion: 2021,
    sourceType: "module"
  }
});

ruleTester.run("slds-modal-button-issue", rule, {
  valid: [
    // ✅ Scenario 1: Correctly formatted modal close button
    {
      code: `<button class="slds-button slds-button_icon slds-modal__close"></button>`,
    },
    // ✅ Scenario 2: Correct lightning-button-icon with proper attributes
    {
      code: `<lightning-button-icon variant="bare" size="large" class="slds-button slds-button_icon"></lightning-button-icon>`,
    },
    // ✅ Scenario 3: Correct lightning-icon usage
    {
      code: `<lightning-icon size="large"></lightning-icon>`,
    },
    {
      code: `<lightning-icon></lightning-icon>`,
    },
    // ✅ Scenario 4: lightning-icon with variant outside a modal close button should be valid
    {
      code: `<lightning-icon variant="bare-inverse"></lightning-icon>`,
    },
    // ✅ Scenario 5: lightning-icon inside a button, but button does NOT have slds-modal__close
    {
      code: `<button><lightning-icon variant="bare-inverse"></lightning-icon></button>`,
    },


    // Scenario 1: This case shouldn't remove the class as button doesn't have a class named slds-modal__close
    {
      code: `<button class="slds-button slds-button_icon slds-button_icon-inverse"></button>`,
    },
    { // Scenario 2: This case shouldn't remove the class as button doesn't have a class named slds-modal__close
      code: `<lightning-button-icon variant="bare-inverse" class="slds-button slds-button_icon"></lightning-button-icon>`
    }
  ],

  invalid: [
    // ❌ Scenario 1: Remove slds-button_icon-inverse from a modal close button
    {
      code: `<button class="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"></button>`,
      errors: [{ message: JSON.stringify({message: messages["removeClass"], suggestions: [`class="slds-button slds-button_icon slds-modal__close"`]}), type: "Tag" }],
      output: `<button class="slds-button slds-button_icon slds-modal__close"></button>`,
    },

    // ❌ Scenario 2: Fix variant="bare-inverse" and ensure size="large" in lightning-button-icon
    {
      code: `<lightning-button-icon variant="bare-inverse" class="slds-button slds-button_icon slds-modal__close"></lightning-button-icon>`,
      errors: [{ message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}) }],
      output: `<lightning-button-icon variant="bare" class="slds-button slds-button_icon slds-modal__close"></lightning-button-icon>`,
    },

    // ❌ Scenario 3: Remove variant attribute in lightning-icon, but only when its parent is a modal close button
    {
      code: `<button class="slds-button slds-modal__close"><lightning-icon variant="bare-inverse" size="medium"></lightning-icon></button>`,
      errors: [
        //{ messageId: "ensureSizeAttribute", type: "Tag" },
        { message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}) }
      ],
      output: `<button class="slds-button slds-modal__close"><lightning-icon variant="bare" size="medium"></lightning-icon></button>`,
    },
    {
      code: `<button class="slds-button slds-modal__close"><lightning-icon variant="bare-inverse"></lightning-icon></button>`,
      errors: [
        { message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}) }
      ],
      output: `<button class="slds-button slds-modal__close"><lightning-icon variant="bare"></lightning-icon></button>`,
    },

    // /** Real use cases from source graph */
    // Scenario 1
    {
      code: `<button class="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse">
                <lightning-icon
                    icon-name="utility:close"
                    alternative-text={cancelButtonLabel}
                    variant="bare-inverse"
                    size="large" >
                </lightning-icon>
                <span class="slds-assistive-text">{cancelButtonLabel}</span>
            </button>`,
      errors: [
        { message: JSON.stringify({message: messages["removeClass"], suggestions: [`class="slds-button slds-button_icon slds-modal__close"`]})},
        { message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}), }
      ],
      output: `<button class="slds-button slds-button_icon slds-modal__close">
                <lightning-icon
                    icon-name="utility:close"
                    alternative-text={cancelButtonLabel}
                    variant="bare"
                    size="large" >
                </lightning-icon>
                <span class="slds-assistive-text">{cancelButtonLabel}</span>
            </button>`,
    },

    // Scenario 2
    {
      code: `<lightning-button-icon
                title={labels.closeButton} icon-name="utility:close"
                onclick={closeAction}
                class="slds-button slds-button_icon slds-modal__close slds-button--icon-inverse" variant="bare-inverse" size="large">
            </lightning-button-icon>`,
      errors: [
        { message: JSON.stringify({message: messages["removeClass"], suggestions: [`class="slds-button slds-button_icon slds-modal__close"`]})},
        { message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}) }
      ],
      output: `<lightning-button-icon
                title={labels.closeButton} icon-name="utility:close"
                onclick={closeAction}
                class="slds-button slds-button_icon slds-modal__close" variant="bare" size="large">
            </lightning-button-icon>`,
    },
    // Scenario 2.a where icon-class exist and that should be treated the same way as class
    {
      code: `<lightning-button-icon
                title={labels.closeButton} icon-name="utility:close"
                onclick={closeAction}
                class="slds-button slds-button_icon slds-modal__close"
                icon-class="slds-button slds-button_icon slds-modal__close slds-button--icon-inverse"
                variant="bare-inverse" size="large">
            </lightning-button-icon>`,
      errors: [
        { message: JSON.stringify({message: messages["removeClass"], suggestions: [`icon-class="slds-button slds-button_icon slds-modal__close"`]})},
        { message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}) },
        { message: JSON.stringify({message:messages["changeVariant"],suggestions:["bare"]}) },
      ],
      output: `<lightning-button-icon
                title={labels.closeButton} icon-name="utility:close"
                onclick={closeAction}
                class="slds-button slds-button_icon slds-modal__close"
                icon-class="slds-button slds-button_icon slds-modal__close"
                variant="bare" size="large">
            </lightning-button-icon>`,
    },
    // Scenario 3
    {
      code: `<header class="slds-modal__header">
                <button class="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse" title={labels.Close} onclick={close}>
                    <svg class="slds-button__icon slds-button__icon_large" aria-hidden="true">
                        <use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                    </svg>
                    <span class="slds-assistive-text">{labels.Close}</span>
                </button>
                <h2 id="modal-heading-01" class="slds-modal__title slds-hyphenate">{heading}</h2>
            </header>`,
      errors: [
        { message: JSON.stringify({message: messages["removeClass"], suggestions: [`class="slds-button slds-button_icon slds-modal__close"`]}) }
      ],
      output: `<header class="slds-modal__header">
                <button class="slds-button slds-button_icon slds-modal__close" title={labels.Close} onclick={close}>
                    <svg class="slds-button__icon slds-button__icon_large" aria-hidden="true">
                        <use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                    </svg>
                    <span class="slds-assistive-text">{labels.Close}</span>
                </button>
                <h2 id="modal-heading-01" class="slds-modal__title slds-hyphenate">{heading}</h2>
            </header>`,
    }

  ],
});