import { client, poll } from '../../apiClient/client';
import { KnownIssues } from '../../utils/KnownIssues';
import { describeIf } from '../../utils/describeIf';

export default (testEnv, testResult, testName = 'undefined') => {
  //Only run this test if the display supports the mute functionality.
  const supportsMute = testEnv.getDisplay().supportsMute;
  const display = testEnv.getDisplay();

  describeIf(supportsMute)('UpdateVolumeMute', () => {
    let targetMute = false;

    //If supported, mute/unmute the display
    it('Changes the mute status of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      //below we are saying is display is not muted 
      // we will targetmute to true that we need to mute the display 
      if (!display.isMuted) {
        targetMute = true;
      }
      const response = await client.updateVolumeMute({
        input: { id: display.id, mute: targetMute },
      });
      // desired: Represents the desired volume level.
      // reported: Represents the reported current volume level.
      // the use of "reported" and "desired" properties in your GraphQL schema allows for the distinction between the current or observed state of volume-related settings (reported) and the desired state that a client might request or set (desired). This distinction is valuable for managing and monitoring the configuration and behavior of a system.
      expect(response.displayUpdateVolumeMute.display.volume.isMuted.desired).toEqual(targetMute);
    });

    //Verify the mute status is as desired
    it('Validates the mute status of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetMute;

      if (testEnv.getDisplay().isMuted == null) return;

      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.volume.isMuted.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.actualResult = response.display.volume.isMuted.reported;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      if (response.display.volume.isMuted.reported != targetMute) {
        expect(KnownIssues.HasKnownIssue(display.id, testName)).toBe(true);
      } else {
        expect(response.display.volume.isMuted.reported).toEqual(targetMute);
        expect(response.display.presence.connected).toEqual(true);
      }
    });
  });
};




