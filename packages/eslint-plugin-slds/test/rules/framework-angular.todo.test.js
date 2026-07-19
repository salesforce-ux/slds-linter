/**
 * Up-front TDD specification for Angular support.
 *
 * Angular support is DESIGNED but DEFERRED. These tests encode the expected
 * behavior so implementation can proceed test-first. They are declared with
 * `it.todo` (pending) so they neither pass nor fail today.
 *
 * Implementation notes (for when this is picked up):
 *  - External `*.component.html` and `*.component.css` already lint today via the
 *    HTML and CSS rule paths (Angular templates are HTML-like).
 *  - Inline template bindings require `@angular-eslint/template-parser`:
 *      - `class="slds-..."`                 -> class-checks (deprecated/BEM/override)
 *      - `[ngClass]="{ 'slds-x': cond }"`    -> object keys + string/array exprs
 *      - `[class.slds-action-overflow--touch]="cond"` -> class binding key
 *      - `[style.--slds-c-foo]="expr"`        -> custom property (hook rules)
 *      - `[style.color]="'#fff'"` / inline `style="..."` -> style-value-checks
 *  - Component decorator `@Component({ template: '...', styles: ['...'] })`
 *    inline template/styles parsed from the TS AST string literals and routed to
 *    the same shared detection cores as JSX.
 */

describe('Angular SLDS support [deferred]', () => {
  describe('template class bindings', () => {
    it.todo('flags deprecated class in static class="slds-action-overflow--touch"');
    it.todo("flags deprecated class in [ngClass]=\"{ 'slds-action-overflow--touch': cond }\"");
    it.todo('flags deprecated class in [class.slds-action-overflow--touch]="cond"');
    it.todo('flags retired BEM class and offers single-underscore fix');
    it.todo('ignores custom (non-slds) classes');
  });

  describe('template style bindings', () => {
    it.todo('flags var(--lwc-*) in [style.color]="expr" / inline style and fixes to --slds hook');
    it.todo('flags --slds-c-* custom property in [style.--slds-c-foo]="expr"');
    it.todo('flags hardcoded color in inline style="color: #ff0000"');
    it.todo('flags --slds var without fallback and adds metadata fallback');
  });

  describe('@Component inline template/styles', () => {
    it.todo("parses template: '<div class=\"slds-...\">' string and flags class artifacts");
    it.todo("parses styles: ['.a{ color: var(--lwc-brandDark); }'] and flags hook artifacts");
  });

  describe('external component files', () => {
    it.todo('*.component.html already lints via HTML rules (documented parity)');
    it.todo('*.component.css already lints via CSS rules (documented parity)');
  });
});
