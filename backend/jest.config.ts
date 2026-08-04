import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['.*\\.integration\\.spec\\.ts$', '.*\\.e2e-spec\\.ts$'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: ['.*\\.spec\\.ts$', '.*\\.integration\\.spec\\.ts$'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: { lines: 80, branches: 70, functions: 80, statements: 80 },
    './modules/appointments/**/*.ts': { lines: 90, branches: 85, functions: 95, statements: 90 },
    './modules/auth/**/*.ts': { lines: 90, branches: 85, functions: 95, statements: 90 },
  },
};
export default config;
