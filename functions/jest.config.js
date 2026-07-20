module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/../node_modules'],
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        noImplicitAny: false,
        noUnusedLocals: false,
        skipLibCheck: true
      }
    }]
  }
};
