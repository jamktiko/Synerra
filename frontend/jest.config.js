module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "html", "js", "json"],
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/app/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
};
