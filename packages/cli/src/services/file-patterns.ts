import { FilePattern } from '../types';

export const StyleFilePatterns: FilePattern = {
  extensions:['css', 'scss', 'less','sass'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**'
  ]
};

export const ComponentFilePatterns: FilePattern = {
  extensions:['html', 'cmp', 'component', 'app', 'page', 'interface'],  
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**'
  ]
}; 