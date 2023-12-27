module.exports = {
  testMatch: ['<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.(j|t)sx?$': 'ts-jest',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/$1',
    '^infra-did-js/(.*)$': '<rootDir>/node_modules/$1',
  },
  setupFilesAfterEnv: ['../jestSetup.ts'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  globals: {
    __DEV__: false, //toggle to true to execute the code in __DEV__ scope
    __VERSION__: 'jest-version',
    __BUILD_DATE__: 'jest-build-date',
    __COMMIT_SHA__: 'jest-commit-sha',
  },
  collectCoverageFrom: [
    '<rootDir>/**',
    '!<rootDir>/index.ts',
    '!<rootDir>/types.ts',
    '!<rootDir>/**.d.ts',
    '!<rootDir>/__tests__/**',
    '!<rootDir>/__fixtures__/**',
    '!<rootDir>/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
