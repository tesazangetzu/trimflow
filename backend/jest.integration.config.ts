import baseConfig from './jest.config';
import type { Config } from 'jest';

const config: Config = {
  ...baseConfig,
  testRegex: '.*\\.integration\\.spec\\.ts$',
  testPathIgnorePatterns: ['.*\\.e2e-spec\\.ts$'],
  testTimeout: 60000,
  maxWorkers: 1,
};
export default config;
