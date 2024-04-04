import { client } from '../apiClient/client';
import { Display } from '../utils/Display';
import UpdateSiteTestSuit from './tests/UpdateSite';
import UpdateAliasTestSuit from './tests/UpdateAlias';
import UpdateContentSourceTestSuit from './tests/UpdateContentSource';
import UpdateGroupTestSuit from './tests/UpdateGroup';
import UpdateOrientationTestSuit from './tests/UpdateOrientation';
import UpdatePowerTestSuit from './tests/UpdatePower';
import UpdateVolumeLevelTestSuit from './tests/UpdateVolumeLevel';
import UpdateVolumeMuteTestSuit from './tests/UpdateVolumeMute';
import UpdatePlaylistTestSuit from './tests/UpdatePlaylist';
import UpdateInfraRedControl from './tests/UpdateInfraRedControl';
import UpdateKeyboardControl from './tests/UpdateKeyboardControl';
import { addMsg } from 'jest-html-reporters/helper';
import { resultHistory, fail } from '../utils/ResultHistory';
import { ControlLockState } from '../apiClient/sdk';
import UpdateLedStripColor from './tests/UpdateLedStripColor';
import UpdatePowerSchedule from './tests/UpdatePowerSchedule';
import UpdateRebootTestSuit from './tests/UpdateReboot';
import { sleep } from '../utils/sleep';
import InstallApp from './tests/InstallApp';
import UninstallApp from './tests/UninstallApp';
import { Log } from '../utils/Log';
// import UpdateUSBControl from './tests/UpdateUSBControl';
// import UpdateAgentReleaseChannel from './tests/UpdateAgentReleaseChannel';

// a popular JavaScript testing framework, to set the maximum timeout for asynchronous tests. It determines the maximum time (in milliseconds) that Jest will wait for a test to complete before considering it as failed due to a timeout.
// This line effectively tells Jest to allow up to 3 minutes for each test to complete. If a test takes longer than this specified timeout, Jest will consider it as failed due to exceeding the timeout limit.
jest.setTimeout(180_000);

// fs and path are Node.js core modules used for working with files and directories.
const fs = require('fs');
const path = require('path');



// global is a global object in Node.js, similar to window in a browser environment.
// __DISPLAYS__ is a variable or property attached to the global object. It's using a naming convention with double underscores (__) to indicate that it might be a special or reserved variable.
//The map function is an array method in JavaScript that iterates over each element of an array and creates a new array by applying a function to each element.
//(display) => new Display(display): This is an arrow function that takes a parameter named display and creates a new Display object using the new Display(display) syntax.
//Display seems to be a constructor function or class for creating display objects.
// new Display(display) is instantiating a new Display object using the provided display parameter.
// This declares a constant variable named displayList to store the result of the map operation.
const displayList = global.__DISPLAYS__.map((display) => new Display(display));

let history = new resultHistory();

//Filter out offline displays
const onlineDisplays = displayList.filter((display) => display.isOnline);
const offlineDisplays = displayList.filter((display) => !display.isOnline);
//This condition checks if the offlineDisplays array has a length greater than zero. In JavaScript, an array with elements evaluates to true in a boolean context.
// we can pass two or more arguments in console.log which print that data in the console 
// It includes a property named offlineDisplays whose value is an array of display IDs. The array is obtained by mapping over the offlineDisplays array and extracting the id property from each display object.
if (offlineDisplays.length) {
  console.log('Not running tests for following displays as they are offline', {
    offlineDisplays: offlineDisplays.map((display) => display.id),
  });
}

// describe.each is a Jest function that allows you to parameterize and repeat a set of tests for each set of values.
// onlineDisplays is an array of display objects, and Jest will execute the described tests once for each display in this array.
// The $id is a placeholder or template literal syntax used by Jest to dynamically insert the value of the id property from each display object into the description of the test suite.
// eg : 
/*
$:
const name = 'World';
const greeting = `Hello, $name!`;
console.log(greeting); // Output: Hello, World!

describe.each: 
Suppose you have an array of objects representing users:
const users = [
  { id: 'user1', name: 'Alice' },
  { id: 'user2', name: 'Bob' },
  { id: 'user3', name: 'Charlie' },
];

Now, you want to create a parameterized test suite that tests some functionality for each user. You can use describe.each as follows:

describe.each(users)('User-related tests for $name', (user) => {
  test('User has an ID', () => {
    expect(user.id).toBeDefined();
  });

  test('User has a name', () => {
    expect(user.name).toBeDefined();
  });
});


*/
//Run the test suite for each display that is online
//Here, $id is a placeholder that will be replaced by the actual ID of the display during test execution.
describe.each(onlineDisplays)('Happy Path scenario for $id', (display) => {
  const logger = new Log(display.alias);
  // testEnv object is a JavaScript object that serves as an environment configuration for testing purposes. It contains three properties 
  const testEnv = {
    // will get the current display
    getDisplay: () => display as Display,
    //his is the condition being checked for each element d of the array. It compares the id property of each d object with the id property of the display object to see if they match.
    // Once the correct element is found (i.e., the element with a matching id), .customer is accessed to retrieve the customer property of that element.
    getCustomer: () => global.__DISPLAYS__.find((d) => d.id === display.id).customer,
    // customer associated with the current display
    // A logger object used for logging within the test environment
    log: logger as Log,
  };

  //After all the tests are done, return the initial state of the display
  afterAll(async () => {
    await sleep(60_000); //delay teardown to avoid race condition
    // await keyword to pause execution until asynchronous operations complete.
    //  Since getDisplay may involve asynchronous operations (like fetching data from an external source), it's possible that this line could also be asynchronous.
    const display = testEnv.getDisplay();

    if (display.site != null) {
      // he await keyword ensures that the function waits for the UpdateSite operation to complete before proceeding further.
      await client.UpdateSite({ input: { displayId: display.id, siteId: display.site.id } });
    }

    if (display.supportsOrientation) {
      await client.updateOrientation({
        input: { id: display.id, orientation: display.orientation },
      });
    }

    await client.updateVolumeLevel({ input: { id: display.id, level: display.volume } });

    if (display.supportsMute) {
      await client.updateVolumeMute({ input: { id: display.id, mute: display.isMuted } });
    }

    if (display.supportsControlLocking) {
      await client.UpdateInfraRedControl({
        input: { displayIds: [display.id], controlState: ControlLockState.Unlocked },
      });
      await client.UpdateKeyboardControl({
        input: { displayIds: [display.id], controlState: ControlLockState.Unlocked },
      });
    }

    if (display.supportsUSBControlLocking) {
      await client.UpdateUSBControl({
        input: { displayIds: [display.id], portsControlState: display.USBControl },
      });
    }

    if (display.playlist != null && display.playlist.source != null) {
      await client.updatePlaylist({
        input: { displayIds: [display.id], playlistId: display.playlist.source.id },
      });
    }

    //Still need to find a fix for B-line await updateContentSource(testEnv);

    if (display.supportsLedStripColor) {
      await client.UpdateLedStripColor({
        input: { displayIds: [display.id], ledStripColor: display.ledStripColor },
      });
    }
    await client.updatePower({ input: { id: display.id, power: display.power } });
  });

  beforeAll(async () => {
    //Print offline displays
    let offlineDisplaysPrint = 'Offline Displays:' + '\n';
    offlineDisplays.forEach(function (display) {
      offlineDisplaysPrint += 'Name: ' + display.alias + ' ID: ' + display.id + '\n';
    });

    addMsg({ message: offlineDisplaysPrint, context: undefined });
  });

  // This object is used to add extra context to
  // the HTML report output
  const testResult = {
    display: display.alias,
    test: 'undefined',
    expectedResult: 'undefined',
    actualResult: 'undefined',
  };

  //After a display has been tested, log the results for the report
  afterEach(async () => {
    if (testResult.actualResult != 'undefined') {
      let currentDisplayStatus = await client.getDisplay({ displayId: testEnv.getDisplay().id });
      // await: This keyword is used to pause the execution of the code until the Promise returned by addMsg is resolved.
      // addMsg: This is the name of the function being called.
      // { ... }: This is an object literal, containing key-value pairs separated by commas.  
      // message: This is a key (property name) of the object. It represents the message being added.
      // JSON.stringify(testResult): This is the value associated with the message key. It converts the testResult object into a JSON string.
      // context: undefined: This is another key-value pair. context is the key, and undefined is the value. It's likely that context is an optional parameter, and it's set to undefined in this particular call to addMsg.
      // addMsg uses message and context is a property of the object 
      await addMsg({ message: JSON.stringify(testResult), context: undefined });
      // "Alias: MyDisplay
      await addMsg({
        message:
          'Alias: ' +
          display.alias +
          ', Agent: ' +
          display.agentVersion +
          ', Connected: ' +
          currentDisplayStatus.display.presence.connected,
        context: undefined,
      });
      /*
      history.testRuns: This likely refers to an array of test runs stored in the history object.
      history.testRuns.length - 1: This expression gets the index of the last test run in the history.testRuns array. history.testRuns.length gives the total number of test runs, and subtracting 1 gives the index of the last test run because array indices are zero-based.
      history.testRuns[history.testRuns.length - 1]: This retrieves the last test run from the history.testRuns array.
      fails: This likely refers to an array of failed tests within a test run. It's assumed that each test run in history.testRuns contains a property named fails which is an array holding information about failed tests.
      push(failedTest): This method call adds the failedTest object to the fails array of the last test run in history.testRuns.
      */
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

  //Test suite

  testEnv.log.Header('Starting tests for display: ' + display.alias);

  UpdateAgentReleaseChannel(testEnv, testResult, 'Change Agent release channel');
  UpdateVolumeMuteTestSuit(testEnv, testResult, 'Change Mute');
  UpdateOrientationTestSuit(testEnv, testResult, 'Change Orientation');
  UpdateAliasTestSuit(testEnv, testResult, 'Change Alias');
  InstallApp(testEnv, testResult, 'Install App');
  UpdateSiteTestSuit(testEnv, testResult, 'Change Site');
  UpdatePowerTestSuit(testEnv, testResult, 'Change Power');
  UpdateContentSourceTestSuit(testEnv, testResult, 'Change Content');
  UpdateGroupTestSuit(testEnv, testResult, 'Add Group');
  UpdatePlaylistTestSuit(testEnv, testResult, 'Sync Playlist');
  UpdateInfraRedControl(testEnv, testResult, 'Change IR lock state');
  UpdateKeyboardControl(testEnv, testResult, 'Change Keyboard lock state');
  UpdateUSBControl(testEnv, testResult, 'Change USB lock state');
  UpdateLedStripColor(testEnv, testResult, 'Change LED strip color');
  UninstallApp(testEnv, testResult, 'Uninstall App');
  UpdateVolumeLevelTestSuit(testEnv, testResult, 'Change Volume');
  UpdatePowerSchedule(testEnv, testResult, 'Change Power Schedule');
  UpdateRebootTestSuit(testEnv, testResult, 'Reboot Display');
});

//Write results to history.txt
// this code ensures that information about failed tests is logged, limits the history of test runs to manage memory usage, and saves the test history to a JSON file for further analysis or reporting purposes
afterAll(() => {
  // here testRuns is the array of test runs which is stored in history object 
  console.log('Fails for last testrun:' + history.testRuns[history.testRuns.length - 1].fails);
  // This condition checks if the last test run has any failed tests. If there are failed tests
  if (history.testRuns[history.testRuns.length - 1].fails.length > 0) {
    //Keep amount of testRuns in history limited
    // This condition checks if the total number of test runs stored in history.testRuns exceeds a certain limit (history.testRunLimit). 
    // If it does, it removes the oldest test run from the beginning of the array using Array.shift().
    if (history.testRuns.length >= history.testRunLimit) {
      history.testRuns.shift();
    }

    // the writeFileSync function from the Node.js fs (file system) module. It writes data to a file synchronously, which means the program waits until the file write operation is complete before continuing
    // path.resolve() is a function from the Node.js path module used to generate an absolute path from relative path segments.
    // process.cwd() returns the current working directory of the Node.js process.
    // 'history/history.json' specifies the path where the file will be written. This is a relative path, where history.json will be created inside a directory named history.
    fs.writeFileSync(
      path.resolve(process.cwd(), 'history/history.json'),
      JSON.stringify(history, null, 1),
      'utf-8',
    );
    // JSON.stringify() converts a JavaScript object (history in this case) into a JSON string.
    // history is the object being converted to a JSON string.
    // null is used as the second parameter to handle any filtering or transformation of the object being stringified. In this case, no transformation is applied.
    // 1 is used as the third parameter to specify the number of spaces to use for indentation in the resulting JSON string. This makes the JSON string more readable by adding indentation.
  }
});

async function updateContentSource(testEnv) {
  const contentTypes = {
    App: 'AppContentSource',
    Input: 'InputContentSource',
    Playlist: 'PlaylistContentSource',
    Bookmark: 'BookmarkContentSource',
  };

  const display = testEnv.getDisplay();
  const source = display.contentSource;
  switch (source.__typename) {
    case contentTypes.App:
      const appResponse = await client.UpdateAppContentSource({
        input: {
          displayIds: [display.id],
          applicationId: source.applicationId,
          label: source.label,
        },
      });
      expect(
        appResponse.displayBulkUpdateAppContentSource.displays[0].contentSource.current.desired
          .__typename,
      ).toEqual(source.__typename);
      break;
    case contentTypes.Input:
      const inputResponse = await client.UpdateInputContentSource({
        input: { displayIds: [display.id], source: source.source },
      });
      expect(
        inputResponse.displayBulkUpdateInputContentSource.displays[0].contentSource.current.desired
          .__typename,
      ).toEqual(source.__typename);
      break;
    case contentTypes.Playlist:
      const playlistResponse = await client.UpdatePlaylistContentSource({
        input: { displayIds: [display.id], playlistId: source.playlistId },
      });
      expect(
        playlistResponse.displayBulkUpdatePlaylistContentSource.displays[0].contentSource.current
          .desired.__typename,
      ).toEqual(source.__typename);
      break;
    case contentTypes.Bookmark:
      const bookmarkResponse = await client.UpdateBookmarkContentSource({
        input: { displayIds: [display.id], index: source.index },
      });
      expect(
        bookmarkResponse.displayBulkUpdateBookmarkContentSource.displays[0].contentSource.current
          .desired.__typename,
      ).toEqual(source.__typename);
      break;
    default:
      const defaultResponse = await client.UpdateInputContentSource({
        input: { displayIds: [display.id], source: source.source },
      });
      expect(
        defaultResponse.displayBulkUpdateInputContentSource.displays[0].contentSource.current
          .desired.__typename,
      ).toEqual(contentTypes.Input);
      break;
  }
}
