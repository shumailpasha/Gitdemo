import { client, poll } from '../../apiClient/client';
import { KnownIssues } from '../../utils/KnownIssues';
import { Log } from '../../utils/Log';
import { sleep } from '../../utils/sleep';

export default (testEnv, testResult, testName = 'undefined') => {
  const display = testEnv.getDisplay();

  //Uninstall an app
  describe('UninstallApp', () => {
    it('Removes app subscription from a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      //Don't attempt to uninstall if the App isn't present on the display
      if (
        (
          await client.getDisplay({ displayId: testEnv.getDisplay().id })
        ).display.contentSource.available.filter(
          (contentSource) =>
            contentSource.__typename === 'AppContentSource' &&
            contentSource.applicationId === display.testApplicationId,
        ).length < 1
      ) {
        console.log('App is not installed. Skipping uninstall.');
        expect(true).toBe(true);
        return;
      }

      //Uninstall the App
      const response = await client.UnassignSubscription({
        input: {
          displayId: display.id,
          subscriptionId: display.testAppSubscriptionId,
        },
      });

      //Unassign the relevant subscription
      let subscription = response.displayRequestAppUninstallation.display.appSubscriptions.filter(
        (sub) => sub.id == display.testAppSubscriptionId,
      )[0];

      //If the assignment of the subscription is not null, it is assigned
      testResult.test = testName;
      testResult.expectedResult = 'AppInstallationUninstallPending';
      testResult.actualResult = subscription.appInstallation.__typename;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(testResult.actualResult).toBe(testResult.expectedResult);
    });

    //Validate the app was uninstalled
    it('Validates the app uninstallation on the display', async () => {
      testEnv.log.Info('Validating Change of release channel.');
      try {
        const response = await poll(
          () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
          (response) => {
            return (
              response.display.contentSource.available.filter(
                (contentSource) =>
                  contentSource.__typename === 'AppContentSource' &&
                  contentSource.applicationId === display.testApplicationId,
              ).length < 1
            );
          },
        );

        testEnv.log.Response(testName, JSON.stringify(response));
        testResult.expectedResult = true;
        testResult.actualResult =
          response.display.contentSource.available.filter(
            (contentSource) =>
              contentSource.__typename === 'AppContentSource' &&
              contentSource.applicationId === display.testApplicationId,
          ).length < 1;

        expect(testResult.actualResult).toBe(testResult.expectedResult);
        expect(response.display.presence.connected).toEqual(true);
      } catch (err) {
        expect(KnownIssues.HasKnownIssue(display.id, testName)).toBe(true);
      }
    });
  });
};
