import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.ts?$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  coverageReporters: [
    "lcov",
    "json-summary"
  ],
  // setupFilesAfterEnv: ['./tests/bootstrap.ts']
};
export default config;