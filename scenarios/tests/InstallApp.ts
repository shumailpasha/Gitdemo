import { client, poll } from '../../apiClient/client';
import { Log } from '../../utils/Log';
import { describeIf } from '../../utils/describeIf';

export default (testEnv, testResult, testName = 'undefined') => 
{
  const display = testEnv.getDisplay();
  

  //Install an app
  describeIf(!display.testAppInstalled)('InstallApp', () => {
    it('Assigns app subscription to a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      //Check for mismatch between subscription and installation
      if (
        /*
        display is an object.
        testAppSubscription is a property of the display object.
        appInstallation is a property of the testAppSubscription object.
        __typename is a property of the appInstallation object.
        */
        display.testAppSubscription.appInstallation != null &&
        /*
        what exactly is the property 
        // Define a car object
        let car = {
        make: 'Toyota',       // Property: Make of the car
        model: 'Camry',       // Property: Model of the car
        year: 2022,           // Property: Year the car was manufactured
        color: 'Blue',        // Property: Color of the car
        isRunning: false      // Property: Indicates whether the car is running or not
        };
        so u can access the property using name 
        console.log(car.make);    // Output: Toyota
        console.log(car.color);   // Output: Blue
        console.log(car.isRunning); // Output: false

        in our case ::
        display is like our car object.
        testAppSubscription is a property of the display object, similar to the make, model, etc., properties of the car object.
        appInstallation is a property of the testAppSubscription object, similar to one of the properties of the car object.
        __typename is a property of the appInstallation object, just like make, model, or year are properties of the car object.

        */
        display.testAppSubscription.appInstallation.__typename !== 'AppInstallationInstalled'
      ) {
        testEnv.log.Error(
          `Test app was assigned incorrectly! Typename is not AppInstallationInstalled. It has __typename ${display.testAppSubscription.appInstallation.__typename}`,
        );
        throw new Error(
          `Test app was assigned incorrectly! Typename is not AppInstallationInstalled. It has __typename ${display.testAppSubscription.appInstallation.__typename}`,
        );
      }

      if (
        display.testAppSubscription.appInstallation != null &&
        display.testAppSubscription.appInstallation.__typename === 'AppInstallationInstalled'
      ) {
        testEnv.log.Error(
          `Test app was already assigned to display but was not installed! It has __typename ${display.testAppSubscription.appInstallation.__typename}`,
        );
        throw new Error(
          `Test app was already assigned to display but was not installed! It has __typename ${display.testAppSubscription.appInstallation.__typename}`,
        );
      }

      //Assign subscription
      const response = await client.AssignSubscription({
        input: {
          displayId: display.id,
          subscriptionId: display.testAppSubscriptionId,
        },
      });

      //Get the relevant subscription
      let subscription = response.displayRequestAppInstallation.display.appSubscriptions.filter(
        (sub) => sub.id == display.testAppSubscriptionId,
      )[0];

      //If the assignment of the subscription is not null, it is assigned
      testResult.test = testName;
      testResult.expectedResult = true;
      testResult.actualResult = subscription.appInstallation != null;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(testResult.actualResult).toBe(testResult.expectedResult);
    });

    //Validate the app was installed
    it('Validates the app installation on the display', async () => {
      testEnv.log.Info('Validating Change of release channel.');
      const response = await poll(
        () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
        (response) => {
          return (
            response.display.contentSource.available.filter(
              (contentSource) =>
                contentSource.__typename === 'AppContentSource' &&
                contentSource.applicationId === display.testApplicationId,
            ).length > 0
          );
        },
      );

      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.expectedResult = display.testApplicationId;
      testResult.actualResult = response.display.contentSource.available.filter(
        (contentSource) =>
          contentSource.__typename === 'AppContentSource' &&
          contentSource.applicationId === display.testApplicationId,
      )[0];

      expect(testResult.actualResult.applicationId).toBe(testResult.expectedResult);
      expect(response.display.presence.connected).toEqual(true);
    });
  });
};
/*
details of asynch()
Synchronous: Tasks are executed one after the other in a sequential and blocking manner.
Asynchronous: Tasks can be initiated and continue to execute without waiting for the completion of previous tasks, allowing for non-blocking behavior.

-->Asynchronous Execution:
An async function does not necessarily run in parallel. Instead, it allows non-blocking execution of asynchronous tasks while the rest of the program continues to run. The async function itself may contain asynchronous operations (e.g., network requests, timers) that don't block the execution of the entire program.
-->Implicit Promise Return:
When an async function is called, it returns a promise. The promise represents the eventual result of the asynchronous operation performed by the async function.
-->await Keyword:
The await keyword is used inside an async function to wait for the resolution of a promise. It allows you to pause the execution of the async function until the promise is fulfilled, making it easier to work with asynchronous code in a more synchronous-looking manner.
-->Error Handling:
If an async function throws an error or if a promise is rejected within the function, the returned promise will be rejected. You can use try/catch blocks or handle errors using the .catch() method on the returned promise.

Q)is it mandatory to use promise when we use the async () ?
Yes, when you declare a function as async, it implicitly returns a promise. This is a fundamental behavior of async functions in JavaScript and TypeScript. The promise represents the eventual result of the asynchronous operation performed by the async function.

So, in summary, while you might not explicitly create promises within an async function, the function itself implicitly returns a promise, and async/await is used to work with the asynchronous behavior in a more readable manner.

example :
async function exampleAsyncFunction() {
  return "Hello, Async!";
}
const resultPromise = exampleAsyncFunction();
console.log(resultPromise); // Output: Promise { 'Hello, Async!' }

-->In this example, exampleAsyncFunction is an async function that returns a string. When you call this function, it returns a promise that will eventually be resolved with the string "Hello, Async!". The resultPromise variable holds that promise.
***->If you ever need to create a promise manually within an async function (although it's less common), you can use the Promise constructor. The Promise constructor takes a function with two parameters: resolve and reject, which are functions that you call to fulfill or reject the promise.
*/
