import { createYield } from 'typescript';
import { client, poll } from '../../apiClient/client';
import { Log } from '../../utils/Log';
import { KnownIssues } from '../../utils/KnownIssues';

export default (testEnv, testResult, testName = 'undefined') => {
  describe('UpdateReboot', () => {
    jest.setTimeout(200_000);
    let display = testEnv.getDisplay();
    let desiredRebootStatus = 'RebootJobCompleted';

    //Reboot the display
    it('Update Reboot', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const response = await client.updateReboot({
        input: { displayIds: display.id, plannedAt: null },
      });
      expect(
        response.displayBulkReboot.displays.filter((dis) => dis.id == display.id)[0].reboot
          .latestJob.__typename,
      ).toEqual('RebootJobPlanned');
    });

    //Verify the reboot completed
    it('Validates the Reboot of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = desiredRebootStatus;

      try {
        const response = await poll(
          () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
          (response) => {
            return response.display.reboot.latestJob.__typename === desiredRebootStatus;
          },
        );

        testEnv.log.Response(testName, JSON.stringify(response));
        testResult.actualResult = response.display.reboot.latestJob.__typename;
        //Null as response invalidates test result
        if (testResult.actualResult == null) {
          return;
        }
        try {
          expect(response.display.reboot.latestJob.__typename).toEqual(desiredRebootStatus);
          expect(response.display.presence.connected).toEqual(true);
        } catch {
          expect(KnownIssues.HasKnownIssue(display.id, testName)).toBe(true);
        }
      } catch (err) {
        testResult.actualResult = 'Error: ' + err;
        testEnv.log.Error(err);
        expect(KnownIssues.HasKnownIssue(display.id, testName)).toBe(true);
      }
    });
  });
};
