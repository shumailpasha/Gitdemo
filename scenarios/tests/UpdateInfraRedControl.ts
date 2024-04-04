import { client, poll } from '../../apiClient/client';
import { describeIf } from '../../utils/describeIf';
import { ControlLockState } from '../../apiClient/sdk';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  //Only run this test if the display supports the IR lock functionality.
  const supportsControlLocking = testEnv.getDisplay().supportsControlLocking;//It retrieves the property supportsControlLocking from the object returned by testEnv.getDisplay(). 

  describeIf(supportsControlLocking)('UpdateInfraRedControl', () => {
    let targetControlState = ControlLockState.Unlocked;
    const display = testEnv.getDisplay();
    //Change IR lock to a random value
    it('Changes the IR control status of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      //const display = testEnv.getDisplay();
      // Declares an array named controlStates that holds values of the ControlLockState type.
      // ControlLockState seems to be an enumeration or a type that defines possible states for control locking.
      // The array is initialized with three control states: Locked, PowerOnly, and VolumeOnly.
      let controlStates: ControlLockState[] = [
        ControlLockState.Locked,
        ControlLockState.PowerOnly,
        ControlLockState.VolumeOnly,
      ];
      // Generates a random number between 0 (inclusive) and 3 (exclusive) using Math.random()
      // Math.floor is used to round down the floating-point number, ensuring it's an integer.
      let random = Math.floor(Math.random() * 3);
      // Assigns the control state corresponding to the randomly generated index to targetControlState.
      // The random variable determines the index used to select a control state from the controlStates array.
      targetControlState = controlStates[random];//we are passing the number to the array to fetch
      // this code snippet creates an array of possible control states (controlStates) and randomly selects one of them to set as the targetControlState. This randomization is achieved by generating a random index (random) based on the length of the array. The selected control state is then assigned to the variable targetControlState.

      const response = await client.UpdateInfraRedControl({
        input: { displayIds: display.id, controlState: targetControlState },//here we are updating the control state 
      });
      //The filter method is used to find the relevant display based on the id property.
      //The parameter dis is a placeholder representing each element of the array during the filtering process.
      //The filter function checks if the id property of the current element (dis) is equal to the id property of the display object.
      // Yes, display.id refers to the id property of the display object passed to the test. This is typically the ID of the current display being tested.
      // This assumes that there is at least one element in the array that satisfies the filter condition. If there were no matches, accessing [0] would result in undefined.
      // hat the test expects at least one display in the response that matches the condition, and it is looking at the first matching display.
      expect(
        response.displayBulkUpdateInfraRedControl.displays.filter((dis) => dis.id == display.id)[0]
          .infraRedControl.desired,
      ).toEqual(targetControlState);
      //In this case, it checks if the value obtained from .infraRedControl.desired is equal to targetControlState.
      //This uses the toEqual matcher from the Jest testing framework to assert that the value on the left side of the matcher is equal to the value on the right side.
    });

    //Verify the IR lock is the desired one
    it('Validates the IR control status of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetControlState;

      //function named poll being used. This function likely performs polling, repeatedly making requests until a specified condition is met.
      //client.getDisplay() is passing two arguments,
      //The second argument is a function that defines the condition for continuing the polling. It returns true when the desired condition is met.
      //the provided code is using a polling mechanism to repeatedly make requests to the client.getDisplay API until the infraRedControl.desired property of the display becomes null. 
      // The result of this polling operation is stored in the response variable. The purpose of this might be to wait until a certain condition is met before proceeding with further actions in the code
      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.infraRedControl.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));//print response in json string format
      testResult.actualResult = response.display.infraRedControl.reported;//this is from grapgh ql
      //Null as response invalidates test result
      //The purpose of checking for null in testResult.actualResult is likely to handle scenarios where the GraphQL response did not provide the expected data. In some cases, if the response is missing or if the data structure is unexpected, it might result in null values. By checking for null, the code is making sure that the test result is only recorded when the response contains valid data.
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.display.infraRedControl.reported).toEqual(targetControlState);
      expect(response.display.presence.connected).toEqual(true);//The second expectation is checking that the connected state of the display is true.
    });
  });
};
