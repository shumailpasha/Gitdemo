module.exports = {
  testMatch: ['**/scenarios/**/*.scenario.ts'],
  transform: {
    '^.+\\.(ts)?$': 'ts-jest',
  },
  reporters: [
    'default',
    [
      'jest-html-reporters',
      { filename: 'index.html', publicPath: './reports', enableMergeData: true, dataMergeLevel: 1 },
    ],
  ],
  testEnvironment: './jestCustomEnvironment.ts',
};

/*
This configuration is tailored for a project that includes TypeScript files in the scenarios directory, 
uses the ts-jest transformer for TypeScript files, 
and generates an HTML test report using the jest-html-reporters reporter. 
The custom test environment is also specified using testEnvironment. 
Adjustments may be needed based on the specific requirements and structure of your project.

//  testMatch: ['**/scenarios/**/*.scenario.ts'],
// testMatch configuration in Jest is used to specify a pattern or an array of patterns that Jest will use to detect test files. 
// This configuration indicates that Jest should look for test files specifically in the scenarios directory and its subdirectories (**/scenarios/), and the filenames of these test files should match the pattern *.scenario.ts. The ** is a wildcard that matches any subdirectory.

//  A reporter is a module responsible for generating test reports based on the test results.
// 'default': This is Jest's default reporter, which prints test results to the console.
// 'jest-html-reporters': This is an additional reporter, jest-html-reporters, which generates an HTML test report. The configuration object following it provides settings for this HTML reporter:

// filename: The name of the HTML file to be generated (index.html in this case).
// publicPath: The path where the HTML report will be saved (./reports in this case).
// enableMergeData: It enables merging data from multiple test runs.
// dataMergeLevel: Specifies the level of data merging.

// testEnvironment means 
// In Jest, the testEnvironment configuration option is used to specify the environment in which your tests will run. 
// The test environment defines the global context and behavior available to your test suites and individual test cases.
// Jest provides several built-in test environments, and you can also create custom test environments to suit your specific needs. 
// The most commonly used built-in test environments include:
