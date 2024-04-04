import { Display } from '../utils/Display';
import { addMsg } from 'jest-html-reporters/helper';
import { resultHistory, fail } from '../utils/ResultHistory';
import UpdatePowerSchedule from './tests/UpdatePowerSchedule';
// import { sleep } from '../utils/sleep';
// import { client, poll } from '../apiClient/client';
// import { Log } from '../utils/Log';

jest.setTimeout(90_000);

// const fs = require('fs');
// const path = require('path');

const fs = require('fs');
const path = require('path');

// const fs = require('fs');
// const path = require('path');
/*
global is a global object in Node.js, similar to window in a browser environment.
__DISPLAYS__ is a variable or property attached to the global object. It seems to hold an array of display data.
The map function is an array method in JavaScript that iterates over each element of an array and creates a new array by applying a function to each element.
Arrow Function inside map: (display) => new Display(display): This is an arrow function that takes a parameter named display and creates a new Display object using the new Display(display) syntax.
Display seems to be a constructor function or class for creating display objects.
new Display(display) is instantiating a new Display object using the provided display parameter.

->For each display, it creates a new Display object using the provided display data.
->The resulting array of Display objects is stored in the displayList constant.
This code is essentially transforming an array of raw display data into an array of Display objects, assuming that there is a constructor function or class named Display that is used to create instances of display objects with the given data. The resulting displayList is a collection of instantiated Display objects based on the data in global.__DISPLAYS__.
*/
const displayList = global.__DISPLAYS__.map((display) => new Display(display));
const hardcodedSchedule = {
  id: 'ad2fef6b-0662-4eda-b663-b79e3bd74494',
  title: 'Automated Power Schedule Test',
};

let history = new resultHistory();
let customerHasSchedule = true;

//Filter out offline displays
const onlineDisplays = displayList.filter((display) => display.isOnline);
const offlineDisplays = displayList.filter((display) => !display.isOnline);
if (offlineDisplays.length) {
  console.log('Not running tests for following displays as they are offline', {
    offlineDisplays: offlineDisplays.map((display) => display.id),
  });
}

//Filter out displays that don't belong to the Test Farm's customer
onlineDisplays.forEach((display) => {
  let logger = new Log(display.alias);
  const testEnv = {
    getDisplay: () => display as Display,
    getCustomer: () => global.__DISPLAYS__.find((d) => d.id === display.id).customer,
    log: logger as Log,
  };
  if (testEnv.getCustomer().handle != global.__TESTFARMHANDLE__) {
    customerHasSchedule = false;
    it('Skips power schedule test', async () => {
      console.log("Device doesn't belong to test farm so power schedule test is skipped.");
    });
  }

  if (
    !testEnv.getDisplay().timeZone.includes('+1') &&
    !testEnv.getDisplay().timeZone.includes('Brussels')
  ) {
    //Skipping test cause timezone of display is not UTC+1
    return;
  }
});

//Sync the power schedule for each online display
describe.each(onlineDisplays)('Automated power schedule test for $id', (display) => {
  const logger = new Log(display.alias);
  const testEnv = {
    getDisplay: () => display as Display,
    getCustomer: () => global.__DISPLAYS__.find((d) => d.id === display.id).customer,
    log: logger as Log,
  };
  if (!customerHasSchedule) {
    //Skipping test
    return;
  }

  if (
    !testEnv.getDisplay().timeZone.includes('+1') &&
    !testEnv.getDisplay().timeZone.includes('Brussels')
  ) {
    //Skipping test cause timezone of display is not UTC+1
    return;
  }
  // This object is used to add extra context to
  // the HTML report output
  const testResult = {
    display: display.alias,
    test: 'undefined',
    expectedResult: 'undefined',
    actualResult: 'undefined',
  };

  //After the test has been executed, log the result for the report
  afterEach(async () => {
    if (testResult.actualResult != 'undefined') {
      await addMsg({ message: JSON.stringify(testResult), context: undefined });

      if (testResult.actualResult != testResult.expectedResult) {
        var failedTest = new fail(
          testResult.display,
          testResult.test,
          testResult.expectedResult,
          testResult.actualResult,
        );
        history.testRuns[history.testRuns.length - 1].fails.push(failedTest);
      }
    }
    testResult.expectedResult = 'undefined';
    testResult.actualResult = 'undefined';
  });

  UpdatePowerSchedule(testEnv, testResult, 'Change Power Schedule', hardcodedSchedule);

  //Print offline displays
  let offlineDisplaysPrint = 'Offline Displays:' + '\n';
  offlineDisplays.forEach(function (display) {
    offlineDisplaysPrint += 'Name: ' + display.alias + ' ID: ' + display.id + '\n';
  });

  addMsg({ message: offlineDisplaysPrint, context: undefined });
});

//Wait 15 minutes until the schedule becomes active and the display is supposed to turn ON
describe('Automated power schedule Wait 15 minutes', () => {
  if (!customerHasSchedule) {
    //Skipping test
    return;
  }
  jest.setTimeout(1000000);
  beforeAll(async () => {
    await sleep(900000);
  });
  it('Wait 15 minutes', () => {});
});

describe.each(onlineDisplays)('Automated power schedule validation for $id', (display) => {
  const logger = new Log(display.alias);
  const testEnv = {
    getDisplay: () => display as Display,
    getCustomer: () => global.__DISPLAYS__.find((d) => d.id === display.id).customer,
    log: logger as Log,
  };
  if (!customerHasSchedule) {
    //Skipping test
    return;
  }

  if (
    !testEnv.getDisplay().timeZone.includes('+1') &&
    !testEnv.getDisplay().timeZone.includes('Brussels')
  ) {
    //Skipping test cause timezone of display is not UTC+1
    return;
  }

  // This object is used to add extra context to
  // the HTML report output
  const testResult = {
    display: display.alias,
    test: 'undefined',
    expectedResult: 'undefined',
    actualResult: 'undefined',
    timeZone: 'undefined',
  };
  //After the test has been executed, log the result for the report
  afterEach(async () => {
    if (testResult.actualResult != 'undefined') {
      await addMsg({ message: JSON.stringify(testResult), context: undefined });
    }

    testResult.expectedResult = 'undefined';
    testResult.actualResult = 'undefined';
  });

  //Verify the currently synced schedule is the expected one
  it('Validates the current power schedule', async () => {
    let response = await client.getDisplay({ displayId: testEnv.getDisplay().id });
    let currentSchedule = response.display.powerSchedule.schedule.id;
    testResult.actualResult = currentSchedule;
    testResult.expectedResult = hardcodedSchedule.id;
    testResult.timeZone = testEnv.getDisplay().timeZone;
    expect(currentSchedule).toEqual(hardcodedSchedule.id);
  });

  //Verify the display is ON, according to the schedule
  it('Validates the current power status', async () => {
    let response = await client.getDisplay({ displayId: testEnv.getDisplay().id });
    let currentPower = response.display.power.reported;
    testResult.actualResult = currentPower;
    testResult.expectedResult = 'ON';
    expect(testResult.actualResult).toEqual(testResult.expectedResult);
  });

  //Print offline displays
  let offlineDisplaysPrint = 'Offline Displays:' + '\n';
  offlineDisplays.forEach(function (display) {
    offlineDisplaysPrint += 'Name: ' + display.alias + ' ID: ' + display.id + '\n';
  });

  addMsg({ message: offlineDisplaysPrint, context: undefined });
});
