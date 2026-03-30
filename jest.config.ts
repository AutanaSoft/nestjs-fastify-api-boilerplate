import * as fs from 'fs';
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';

const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
const compilerOptions = tsconfig.compilerOptions;

const baseProject: Config = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { configFile: '.swcrc' }],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths as Record<string, string[]>, {
    prefix: '<rootDir>/',
  }),
  testEnvironment: 'node',
  cacheDirectory: '.tmp/jestCache',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s',
    '<rootDir>/src/**/*.(t|j)sx',
    '!<rootDir>/src/config/**/*.(t|j)s',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/modules/database/prisma/**',
    '!<rootDir>/src/**/index.(t|j)s',
  ],
  clearMocks: true,
  modulePaths: ['./'],
};

const config: Config = {
  projects: [
    {
      ...baseProject,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
    },
    {
      ...baseProject,
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      testTimeout: 30000,
      setupFilesAfterEnv: ['<rootDir>/test/utils/e2e-after-env.ts'],
      globalTeardown: '<rootDir>/test/utils/global-teardown.ts',
    },
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;
