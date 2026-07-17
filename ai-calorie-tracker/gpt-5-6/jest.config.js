module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
};
