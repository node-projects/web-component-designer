export default {
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  preset: "ts-jest",
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