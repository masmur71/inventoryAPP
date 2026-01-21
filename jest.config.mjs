/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm', // preset ESM
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Mapping import .js to .ts
  },
  transform: {
    // transform TypeScript files using ts-jest with ESM support
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/*.test.ts'], // 
  verbose: true,
  forceExit: true, // force exit after tests complete
  testTimeout: 30000, // 30 seconds timeout
};