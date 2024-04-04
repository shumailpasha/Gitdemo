import { client, poll } from '../../apiClient/client';
import { describeIf } from '../../utils/describeIf';
import { ControlLockState } from '../../apiClient/sdk';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  //Only run this test if the display supports the Keyboard lock functionality.
  const supportsControlLocking = testEnv.getDisplay().supportsControlLocking;

  describeIf(supportsControlLocking)('UpdateKeyboardControl', () => {
    let targetControlState = ControlLockState.Unlocked;
    const display = testEnv.getDisplay();

    //Change the keyboard lock to a random value
    it('Changes the Keyboard control status of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);

      let controlStates: ControlLockState[] = [
        ControlLockState.Locked,
        ControlLockState.PowerOnly,
        ControlLockState.VolumeOnly,
      ];
      let random = Math.floor(Math.random() * 3);
      targetControlState = controlStates[random];

      const response = await client.UpdateKeyboardControl({
        input: { displayIds: display.id, controlState: targetControlState },////here we are updating the control state
      });
      expect(
        response.displayBulkUpdateKeyboardControl.displays.filter((dis) => dis.id == display.id)[0]
          .keyboardControl.desired,
      ).toEqual(targetControlState);
    });

    //Verify the current lock is the desired one
    it('Validates the Keyboard control status of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetControlState;

      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.keyboardControl.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.actualResult = response.display.keyboardControl.reported;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.display.keyboardControl.reported).toEqual(targetControlState);
      expect(response.display.presence.connected).toEqual(true);
    });
  });
};
