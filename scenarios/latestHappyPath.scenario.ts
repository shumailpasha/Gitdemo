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
import UpdateUSBControl from './tests/UpdateUSBControl';
import UpdateAgentReleaseChannel from './tests/UpdateAgentReleaseChannel';
import UpdateTimezone from './tests/UpdateTimeZone';

jest.setTimeout(180_000);

const fs = require('fs');
const path = require('path');

const displayList = global.__DISPLAYS__.map((display) => new Display(display));

let history = new resultHistory();

//Filter out offline displays
const onlineDisplays = displayList.filter((display) => display.isOnline);
const offlineDisplays = displayList.filter((display) => !display.isOnline);
if (offlineDisplays.length) {
  console.log('Not running tests for following displays as they are offline', {
    offlineDisplays: offlineDisplays.map((display) => display.id),
  });
}

//Run the test suite for each display that is online
describe.each(onlineDisplays)('Happy Path scenario for $id - $alias', (display) => {
  const logger = new Log(display.alias);
  const testEnv = {
    getDisplay: () => display as Display,
    getCustomer: () => global.__DISPLAYS__.find((d) => d.id === display.id).customer,
    log: logger as Log,
  };

  //After all the tests are done, return the initial state of the display
  afterAll(async () => {
    await sleep(60_000); //delay teardown to avoid race condition
    const display = testEnv.getDisplay();

    if (display.site != null) {
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

      await addMsg({ message: JSON.stringify(testResult), context: undefined });
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
  UpdatePowerTestSuit(testEnv, testResult, 'Change Power');
  UpdateRebootTestSuit(testEnv, testResult, 'Reboot Display');
  UpdateAgentReleaseChannel(testEnv, testResult, 'Change Agent release channel');
  UpdateVolumeMuteTestSuit(testEnv, testResult, 'Change Mute');
  UpdateOrientationTestSuit(testEnv, testResult, 'Change Orientation');
  UpdateAliasTestSuit(testEnv, testResult, 'Change Alias');
  InstallApp(testEnv, testResult, 'Install App');
  UpdateSiteTestSuit(testEnv, testResult, 'Change Site');
  UpdateContentSourceTestSuit(testEnv, testResult, 'Change Content');
  UpdateGroupTestSuit(testEnv, testResult, 'Add Group');
  UpdatePlaylistTestSuit(testEnv, testResult, 'Sync Playlist');
  UpdateInfraRedControl(testEnv, testResult, 'Change IR lock state');
  UpdateKeyboardControl(testEnv, testResult, 'Change Keyboard lock state');
  // UpdateUSBControl(testEnv, testResult, 'Change USB lock state'); Due to a bug in the firmware that removes ADB connections when using USB locking, this test is temporarily disabled
  UpdateLedStripColor(testEnv, testResult, 'Change LED strip color');
  UninstallApp(testEnv, testResult, 'Uninstall App');
  UpdateVolumeLevelTestSuit(testEnv, testResult, 'Change Volume');
  UpdatePowerSchedule(testEnv, testResult, 'Change Power Schedule');
  UpdateTimezone(testEnv, testResult, 'Change Timezone');
  // UpdateRebootTestSuit(testEnv, testResult, 'Reboot Display');
});

//Write results to history.txt
afterAll(() => {
  const jsonString1 = JSON.stringify(history.testRuns[history.testRuns.length - 1].fails);
  console.log('Fails for last testrun : ' + jsonString1);
  //Only keep the testRun if it has fails
  if (history.testRuns[history.testRuns.length - 1].fails.length > 0) {
    //Keep amount of testRuns in history limited
    if (history.testRuns.length >= history.testRunLimit) {
      history.testRuns.shift();
    }

    fs.writeFileSync(
      path.resolve(process.cwd(), 'history/history.json'),
      JSON.stringify(history, null, 1),
      'utf-8',
    );
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
