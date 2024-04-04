import { client, poll } from '../../apiClient/client';
import { Orientation } from '../../apiClient/sdk';
import { Log } from '../../utils/Log';
import { describeIf } from '../../utils/describeIf';

export default (testEnv, testResult, testName = 'undefined') => {
  const supportsOrientation = testEnv.getDisplay().supportsOrientation;
  describeIf(supportsOrientation)('UpdateOrientation', () => {
    let targetOrientation;
    const display = testEnv.getDisplay();
    //Switch orientation
    it('Changes the orientation of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const display = testEnv.getDisplay();

      var currentOrientation = display.orientation;
      if (currentOrientation == Orientation.Portrait) {
        targetOrientation = Orientation.Landscape;
      } else {
        targetOrientation = Orientation.Portrait;
      }
      //here we are using graphql 
      const response = await client.updateOrientation({
        input: {
          id: display.id,
          orientation: targetOrientation,
        },
      });
      testEnv.log.Info(JSON.stringify(response));
      expect(response.displayUpdateOrientation.display.orientation.desired).toEqual(
        targetOrientation,
      );
    });

    //Verify the orientation is the desired one
    it('Validates the orientation of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.orientation.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.test = testName;
      testResult.expectedResult = targetOrientation;
      testResult.actualResult = response.display.orientation.reported;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.display.orientation.reported).toEqual(targetOrientation);
      expect(response.display.presence.connected).toEqual(true);
    });
  });
};
