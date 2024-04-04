import { client, poll } from '../../apiClient/client';
import { describeIf } from '../../utils/describeIf';
import { LedStripColor } from '../../apiClient/sdk';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  //Only run this test if the display supports the LED strip functionality.
  const supportsLedStripColor = testEnv.getDisplay().supportsLedStripColor;

  describeIf(supportsLedStripColor)('UpdateLedStripColor', () => {
    let targetColor = LedStripColor.Blue;
    const display = testEnv.getDisplay();

    //If the display supports LED, change it to a random color
    it('Changes the LedStripColor of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const display = testEnv.getDisplay();
      let colors: LedStripColor[] = [
        LedStripColor.White,
        LedStripColor.Red,
        LedStripColor.Green,
        LedStripColor.Blue,
        LedStripColor.Yellow,
        LedStripColor.Cyan,
        LedStripColor.Magenta,
      ];

      let random = Math.floor(Math.random() * 3);
      targetColor = colors[random];
      const response = await client.UpdateLedStripColor({
        input: { displayIds: display.id, ledStripColor: targetColor },//here we are updating the color 
      });
      expect(
        response.displayBulkUpdateLedStripColor.displays.filter((dis) => dis.id == display.id)[0]
          .ledStripColor.desired,
      ).toEqual(targetColor);
    });

    //Verify the current LED color is the desired one
    it('Validates the LedStripColor of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetColor;

      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.ledStripColor.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.actualResult = response.display.ledStripColor.reported;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.display.ledStripColor.reported).toEqual(targetColor);
      expect(response.display.presence.connected).toEqual(true);
    });
  });
};
