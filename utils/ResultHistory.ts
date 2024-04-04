const fs = require('fs');
const path = require('path');

export class resultHistory {
  constructor() {
    //Check if a history file already exists.
    if (fs.existsSync(this.historyPath)) {
      let history = JSON.parse(fs.readFileSync(this.historyPath));
      this.testRuns = history.testRuns;
    } else {
      this.testRuns = new Array<testRun>();
    }

    this.testRuns.push(new testRun());
  }

  historyPath = path.resolve(process.cwd(), 'history/history.json');
  testRunLimit = 30;
  testRuns: Array<testRun>;
}

/*
below code of test run is the reference 

Initialization in the Constructor:
->Initializing properties in the constructor is useful when you want to set default values
   or perform some logic during the instance creation.
->Declaring properties outside the constructor is a way to specify the types and 
  indicate that these properties are part of the class.
->In TypeScript, it's valid to declare properties without initializing them immediately. 
  The initialization can happen later in the constructor or other methods.   
*/
export class testRun {
  constructor() {
    this.date = new Date();
    this.fails = new Array<fail>();
  }
  date: Date;
  fails: Array<fail>;
}

export class fail {
  constructor(display: string, test: string, expectedResult: string, actualResult: string) {
    this.display = display;
    this.test = test;
    this.expectedResult = expectedResult;
    this.actualResult = actualResult;
  }

  display;
  test;
  expectedResult;
  actualResult;
}

/*
The resultHistory class manages a history of test runs, each represented by a testRun instance.
Each testRun instance contains a date and an array of fail instances, where each fail instance represents a failed test case.
The structure allows for keeping a record of failed test cases, organizing them by test runs, and limiting the number of stored test runs.
*/

