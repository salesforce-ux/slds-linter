## Enforce `--sds` to `--slds`

   .myCustomClass{
      border-radius: var(--sds-g-sizing-border-1);
   }

## Enforce use of Utility classes
   .test-utility-class {
      position: static;
   }

   .test-utility-class2 {
      display: none;
   }

## `--lwc` to `--slds` token
   .testLWC {
      background-color: var(--lwc-brandPrimary);
   }
   .testLWC2 {
      background-color: var(--lwc-brandPrimaryTransparent10);
   }
   .testLWC3 {
      padding: var(--lwc-cardFooterPadding);
      margin: var(--lwc-cardHeaderMargin);
   }
   .testLWC4 {
      text-align: var(--lwc-cardFooterTextAlign);
      border-width: var(--lwc-borderWidthThin);
   }
   .testLWC5 {
      background-color: var(--lwc-brandBackgroundDark);
   }

## No Aura token
   .testLWC {
      color: t(brandPrimary);
      color: var(--lwc-brandPrimary);
      color: token(brandPrimaryTransparent10);
   }

## No calc() function usage
   testClass {
      height: calc(100% - 96px);
   }

## No Deprecated `slds` classes
   .slds-box_border{
      font: optional;
   }

## No Deprecated `slds` hooks
   .div-modal-cls {
      color: t(--slds-c-accordion-heading-text-color);
   }
## No hardcoded values

   .hardcoded-value{
      background-color: #fff;
      border-color: #fff;
      color: #fff;
      color: #05628a;
   }

   .hardcoded-value2{
      border-radius: 1rem;
   }

## No Important tag
   .importantCls {
      width: 25% !important;
   }

## No LWC Custom properties
   .myCustomClass{
      --lwc-brandPrimary: blue;
   }


## No Deprecated `slds2` classes
   .slds-timeline__title-content {
      position: relative;
      top: -1px;
      padding-right: 1rem;
      background: white;
      z-index: 2; 
   }

## No `sds` custom properties
   .myCustomClass{
	   --sds-c-button-brand-color-background: var(--slds-g-color-brand-base-30);
   }
   .myCustomClass2{
      --sds-g-sizing-border-1: var(--slds-c-button-brand-color-background-active);
   }

## No `slds` class overrides
   .slds-button--last{
      border-start-start-radius: 0;
   }

## No `slds` private vars
   :where(html){
      --_slds-c-path-item-color-background-active: var(--slds-g-color-surface-container-inverse-1);
   }

## No unused css classes
   .abcCls {
      background-color: red;
   }











## SLDS Deprecated classes $
.slds-wizard__label {
   display: block;
   margin-top: 0.75rem; 
}

.slds-box_border {
	padding: 0;
	border-radius: .25rem;
	border: 1px solid #dddbda
}

## SLDS Deprecated hooks $
lightning-tabset {
   --slds-c-tabs-list-color-border: transparent;
   --slds-c-tabs-item-spacing-block-start: var(--lwc-spacingXSmall);
   --slds-c-tabs-item-spacing-block-end: var(--lwc-spacingXSmall);
}

## Utility class usage

.test-utility-class {
	position: static;
}

.test-utility-class2 {
   display: none;
}

## Enforce BEM Usage
   Not sure on how to guide customers here, we have two rules here.
   1. BEM rule
   2. no SLDS overrides rule.
   .THIS .slds-text-heading_large {
      font-size: 120%;
   }

## No `slds` var without fallback
   .example {
      color: var(--slds-color-brand);
   }

   // Should be: 
   .example {
      color: var(--slds-color-brand, #000000);
   }

   // For known SLDS variables, the rule suggests suitable fallbacks:
   .example {
      color: var(--slds-g-link-color-focus);
   }

   // Will be fixed to:
   .example {
      color: var(--slds-g-link-color-focus, #014486);
   }


## TODO
In utility classes, we are giving only 1 option. Ideally we should return all but then some how we need get context. 


