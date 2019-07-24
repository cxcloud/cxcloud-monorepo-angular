module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['text', 'cobertura', 'lcov'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  testMatch: ['**/*.(test|spec).(ts|js)']
};
