/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  testTimeout: 10000,
  collectCoverage: true,
  "collectCoverageFrom": [
    "src/*.{js,ts}",
    "!**/node_modules/**",
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
