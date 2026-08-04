import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  setupFiles: ['<rootDir>/test/e2e/setup-env.ts'],
  globalSetup: '<rootDir>/test/testcontainers/global-setup.ts',
  globalTeardown: '<rootDir>/test/testcontainers/global-teardown.ts',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testTimeout: 60000,
  maxWorkers: 1,
};
export default config;
