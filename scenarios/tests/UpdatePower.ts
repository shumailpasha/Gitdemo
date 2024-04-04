import { createYield } from 'typescript';
import { client, poll } from '../../apiClient/client';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  //Switch power status
  describe('UpdatePower', () => {
    let power;
    let desiredPower;
    const display = testEnv.getDisplay();

    it('Update power', async () => {
      testEnv.log.Info('Running test: ' + testName);
      power = testEnv.getDisplay().power;

      //Temporary: always set power state to ON
      /*if (power == 'ON') {
        desiredPower = 'STANDBY';
      } else {
        desiredPower = 'ON';
      }*/
      desiredPower = 'ON';

      const response = await client.updatePower({
        input: { id: testEnv.getDisplay().id, power: desiredPower },// in power variable we will pass the what actually we meed from the .getDisplay().id
      });
      expect(response.displayUpdatePower.display.power.desired).toEqual(desiredPower); //graphql
    });

    //Verify the current power status is the desired one
    it('Validates the power of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = desiredPower;

      try {
        const response = await poll(
          () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
          (response) => {
            return response.display.power.desired === null;
          },
        );

        testEnv.log.Response(testName, JSON.stringify(response));
        testResult.actualResult = response.display.power.reported;
        //Null as response invalidates test result
        if (testResult.actualResult == null) {
          return;
        }
        expect(response.display.power.reported).toEqual(desiredPower);
        expect(response.display.presence.connected).toEqual(true);
      } catch (err) {
        testResult.actualResult = 'Error: ' + err;
        expect(testResult.actualResult).toEqual(testResult.expectedResult);
      }
    });
  });
};
