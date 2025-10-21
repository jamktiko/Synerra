module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|js|html)$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "html", "js", "json"],
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/app/$1",
  },
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
      stringifyContentPathRegex: "\\.html$",
    },
  },
};
