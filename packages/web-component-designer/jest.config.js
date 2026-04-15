export default {
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).+(mts|ts|tsx|mjs|js)'],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  transform: {
    '^.+\\.(mts|ts|tsx|mjs|js)$': [
      "ts-jest",
      {
        "useESM": true,
        "tsconfig": {
          "allowJs": true
        }
      }
    ]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(?:@node-projects/base-custom-webcomponent)(?:/|$))'
  ]
}