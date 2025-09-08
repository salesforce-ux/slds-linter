import { type JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: "tsconfig.spec.json"
    }],
    '^.+\\.(yml|yaml)$': '<rootDir>/jest-yaml-transform.mjs',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@salesforce-ux/eslint-plugin-slds)/)'
  ],
  testPathIgnorePatterns: [
    "<rootDir>/build/",
    "<rootDir>/node_modules/"
  ],
  testMatch: [
    "<rootDir>/tests/**/*.spec.ts",
    "<rootDir>/tests/**/*.test.ts"
  ],
  coverageReporters: [
    "lcov",
    "json-summary"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'yml', 'yaml'],
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  verbose: true,
  detectOpenHandles: true,
}

export default jestConfig