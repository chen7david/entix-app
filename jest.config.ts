import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest/presets/default-esm', // Use ESM preset
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    globalSetup: '<rootDir>/tests/global-setup.ts',
    globalTeardown: '<rootDir>/tests/global-teardown.ts',
    verbose: true,
    testTimeout: 30000,
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
};

export default config;
