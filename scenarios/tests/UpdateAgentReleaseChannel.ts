import { client, poll } from '../../apiClient/client';
import { ReleaseChannel } from '../../apiClient/sdk';
import { Log } from '../../utils/Log';
import { describeIf } from '../../utils/describeIf';
import { sleep } from '../../utils/sleep';

export default (testEnv, testResult, testName = 'undefined') => {
  /*-->testEnv: This parameter represents the testing environment. It likely contains information or methods necessary for the execution of the tests.
       It is used throughout the function to interact with the testing environment, such as getting the display, 
       checking the agent release channel, and logging information.

    -->testResult: This parameter is used to store and manage the results of the tests. 
        It seems to be an object that is updated throughout the execution of the tests to keep track of the test name, expected result, 
        and actual result. The final test result is checked against the expected result using Jest's expect statements.

    -->testName: This is an optional parameter with a default value of 'undefined'. 
        It represents the name of the test. It is used for logging and is also passed as part of the test results.
      */
  //here we are trying to compare with the channel displayed and with the constant ReleaseChannel.Alpha
  // here in testEnv has a method which has .getdisplay which will check the displayed content and it returns the property agentReleaseChannel is alpha or not 
  const bIsOnAlpha = testEnv.getDisplay().agentReleaseChannel == ReleaseChannel.Alpha;
  //Change the agent release channel of a display
  describeIf(!bIsOnAlpha)('AgentReleaseChannel', () => {
    const display = testEnv.getDisplay();
    it('Changes the agent release channel of a display', async () => {
      testEnv.log.Info('Changing release channel.');

      const response = await client.UpdateAgentReleaseChannel({
        input: {
          displayIds: display.id,
          releaseChannel: ReleaseChannel.Alpha,
        },
      });
      //a Promise is an object that represents the eventual completion or failure of an asynchronous operation and its resulting value. 
      //It is a way to handle asynchronous code in a more structured and manageable manner. 
      //The resolve function is used to fulfill the promise with a value.
      testResult.test = testName;
      testResult.expectedResult = 'DisplayBulkUpdateAgentReleaseChannelPayload';
      testResult.actualResult = response.displayBulkUpdateAgentReleaseChannel.__typename;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.displayBulkUpdateAgentReleaseChannel.__typename).toBe(
        testResult.expectedResult,
      );
    });

    //Validate the channel was changed
    it('Validates the change of agent release channel', async () => {
      testEnv.log.Info('Validating Change of release channel.');

      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return response.display.agentReleaseChannel.desired === null;
        },
      );
      /*
      poll(() => client.getDisplay({ displayId: testEnv.getDisplay().id }), (response) => {...}):

      This line is using a poll function to repeatedly call the provided function until a specified condition is met.
      The first argument is the function to be called in each iteration, and the second argument is the condition function.
      () => client.getDisplay({ displayId: testEnv.getDisplay().id }):

      This is an arrow function that is being passed as the first argument to poll.
      It calls the client.getDisplay method with the displayId obtained from testEnv.getDisplay().id.
      (response) => { return response.display.agentReleaseChannel.desired === null; }:

      This is the condition function passed as the second argument to poll.
      It takes the response from the client.getDisplay call as a parameter.
      The condition checks if response.display.agentReleaseChannel.desired is null.
      The poll function will keep calling the first function until the condition becomes true.
      const response = await poll(...);

      The await keyword is used to wait for the result of the poll function.
      The result, which is the response from the client.getDisplay call that satisfies the condition, is stored in the response variable.
      In summary, this code is using a polling mechanism to repeatedly call client.getDisplay until the agentReleaseChannel.desired becomes null. The result of the successful call is stored in the response variable. Polling is a technique commonly used in asynchronous programming to wait for a certain condition to be met.
      */

      testResult.expectedResult = ReleaseChannel.Alpha;
      testResult.actualResult = response.display.agentReleaseChannel.reported;
      testEnv.log.Response(testName, JSON.stringify(response));
      //Give the agent 90 seconds to update to the latest Alpha version
      await sleep(90_000);

      expect(testResult.actualResult).toBe(testResult.expectedResult);
    });
  });
};
