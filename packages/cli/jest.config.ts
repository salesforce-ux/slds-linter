import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: "tsconfig.spec.json"
    }],
  },
  testPathIgnorePatterns: ["build", "node_modules"],
  testMatch: [
    "**/tests/**/*.[jt]s?(x)",
    "**/tests/**/?(*.)+(spec|test).[tj]s?(x)",
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  coverageReporters: [
    "lcov",
    "json-summary"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  roots: ['<rootDir>'],
}

export default jestConfig