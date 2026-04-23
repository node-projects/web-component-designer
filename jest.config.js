export default {
  testMatch: ['**/?(*.)+(spec|test).+(mts|ts|tsx|mjs|js)'],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
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