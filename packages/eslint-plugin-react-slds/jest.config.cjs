module.exports = {
  verbose: true,
  testMatch: ['**/test/**/*.test.js', '**/test/**/*.test.mjs'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', {tsconfig: {module: 'CommonJS', moduleResolution: 'Node'}}],
    '^.+\\.(yml|yaml)$': '<rootDir>/jest-yaml-transform.cjs',
  },
  coverageReporters: ['lcov', 'json-summary'],
};
