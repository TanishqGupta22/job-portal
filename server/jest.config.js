module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.js'],
  testTimeout: 30000,
};
