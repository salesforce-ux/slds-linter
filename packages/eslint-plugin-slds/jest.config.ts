import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(yml|yaml)$': '<rootDir>/jest-yaml-transform.js',
  },
  coverageReporters: [
    "lcov",
    "json-summary"
  ],
  // setupFilesAfterEnv: ['./tests/bootstrap.ts']
};
export default config;