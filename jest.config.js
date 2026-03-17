export default {
  testMatch: ['**/?(*.)+(spec|test).+(mts|ts|tsx|mjs|js)'],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  transform: {
    '^.+\\.(mts|ts|tsx)$': [
      "ts-jest",
      {
        "useESM": true
      }
    ]
  }
}