import { client, poll } from '../../apiClient/client';
import { describeIf } from '../../utils/describeIf';

export default (testEnv, testResult, testName = 'undefined') => {
  const suportsVolumeLevel = typeof testEnv.getDisplay().volume === 'number';
  describeIf(suportsVolumeLevel)('UpdateVolumeLevel', () => {
    let targetVolume;
    const display = testEnv.getDisplay();

    //Change the volume to a random value within the min/max constraints
    it('Changes the volume of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);

      targetVolume = Math.floor(Math.random() * (display.maxVolume - display.minVolume)) + display.minVolume;
      const response = await client.updateVolumeLevel({
        input: { id: display.id, level: targetVolume },
      });
      expect(response.displayUpdateVolumeLevel.display.volume.level.desired).toEqual(targetVolume);
    });

    //Verify the volume is at the desired level
    it('Validates the volume of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.volume.level.desired === null;
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.test = testName;
      testResult.expectedResult = targetVolume;
      testResult.actualResult = response.display.volume.level.reported;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.display.volume.level.reported).toEqual(targetVolume);
      expect(response.display.presence.connected).toEqual(true);
    });
  });
};
// math.random()
// Math.random() generates a random floating-point number between 0 (inclusive) and 1 (exclusive).
// what does this between 0 (inclusive) and 1 (exclusive). means??
// 0 (inclusive): This means that the value 0 is included as a possible outcome. In other words, Math.random() can generate values greater than or equal to 0.
// 1 (exclusive): This means that the value 1 is not included as a possible outcome. In other words, Math.random() generates values less than 1, but it will never actually be 1.
// So, when you call Math.random(), you get a random floating-point number in the range [0, 1), where 0 is included, and 1 is excluded. The range is inclusive on the lower bound (0) and exclusive on the upper bound (1).
// example : 
// Generate a random number between min (inclusive) and max (exclusive)
/*
function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

const randomInRange = getRandomNumber(10, 20);
console.log(randomInRange);

random function basically will fetch u the random floating value for eg above u have used 10, 20 then
it will fetch the values from 10 to 19.9999 but not 20 this is the speciality of random function and 
floor will roundoff the value to a integer  

the line generates a random volume within the specified range (display.minVolume to display.maxVolume) for the targetVolume variable. The random volume is obtained by scaling a random floating-point number, rounding it down to an integer, and then adding an offset to ensure the result is within the desired volume range.
*/