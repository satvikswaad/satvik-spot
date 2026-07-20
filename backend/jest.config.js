module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
};
