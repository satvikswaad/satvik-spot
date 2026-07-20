module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/../node_modules'],
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: {
        noImplicitAny: false,
        noUnusedLocals: false,
        skipLibCheck: true
      }
    }]
  }
};
