import { defineConfig } from 'eslint/config';
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds';
import reactSldsPlugin from '@salesforce-ux/eslint-plugin-react-slds';

export default defineConfig([
  ...sldsPlugin.configs['flat/recommended'],
  ...reactSldsPlugin.configs.recommended,
]);
