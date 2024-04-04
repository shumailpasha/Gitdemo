import { client, poll } from '../../apiClient/client';
import { describeIf } from '../../utils/describeIf';
import { ControlLockState, PortsControlLockState, PortsControlState } from '../../apiClient/sdk';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  //Only run this test if the display supports the IR lock functionality.
  const supportsUSBLocking = testEnv.getDisplay().supportsUSBControlLocking;

  describeIf(supportsUSBLocking)('UpdateUSBControl', () => {
    let targetControlState = PortsControlLockState.Unlocked; //this imported method which has unlock property
    const display = testEnv.getDisplay();
    //Change IR lock to a random value
    it('Changes the USB control status of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      //const display = testEnv.getDisplay();
      // below code we are creating controlStates array of type PortsControlLockState
      let controlStates: PortsControlLockState[] = [
        //we have two things locked and unlocked  inside the controlStates
        PortsControlLockState.Locked,
        PortsControlLockState.Unlocked,
      ];
      //we are using random value here to get the random controlStates 
      let random = Math.floor(Math.random() * 2);
      targetControlState = controlStates[random];

      const response = await client.UpdateUSBControl({
        input: { displayIds: display.id, portsControlState: targetControlState },
      });
      expect(
        response.displayBulkUpdatePortsControl.displays.filter((dis) => dis.id == display.id)[0]
          .portsControl.desired,
      ).toEqual(targetControlState);
    });

    //Verify the IR lock is the desired one
    it('Validates the USB control status of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetControlState;

      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.portsControl.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.actualResult = response.display.portsControl.reported;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.display.portsControl.reported).toEqual(targetControlState);
      expect(response.display.presence.connected).toEqual(true);
    });
  });
};
