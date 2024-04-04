import { client } from '../../apiClient/client';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  //Change the Alias of a display
  describe('Alias', () => {
    const display = testEnv.getDisplay();

    it('Changes the alias of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const response = await client.updateAlias({
        input: {
          displayId: display.id,
          alias: display.alias + ' renamed',
        },
      });

      testResult.test = testName;
      testResult.expectedResult = display.alias + ' renamed';
      testResult.actualResult = response.displayUpdateAlias.alias;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.displayUpdateAlias.alias).toBe(display.alias + ' renamed');
    });

    //Change the alias back to the initial value
    it('Changes the alias of a display back to the initial value', async () => {
      testEnv.log.Info('Validating test: ' + testName);

      const response = await client.updateAlias({
        input: {
          displayId: display.id,
          alias: display.alias,
        },
      });
      testEnv.log.Response(testName, JSON.stringify(response));
      expect(response.displayUpdateAlias.alias).toBe(display.alias);
    });
  });
};
