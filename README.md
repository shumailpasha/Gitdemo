# E2E Tests for WAVE API

The repository contains e2e tests for WAVE API. We use Gitlab [Schedules](https://git.inthepocket.org/tp-vision/e2e/-/pipeline_schedules) to run the tests against simulators and real displays.

## Run Tests

Before you start: Install Node.js and Yarn

1. Install Dependencies

```bash
yarn
```

2. Set API_KEY envirnomental variable to your Personal WAVE API key

```bash
export API_KEY=YourAPIKey
```

3. Run the tests

```bash
yarn test
```

# Architecture

## The Goals (ordered by priorirty)

- QA should be productive adding and editing tests without Dev
- Support sharing data between tests
- Stable run order of test suits
- Reporting in HTML format
- Works out-of-the-box
- Conditionally running tests
- Performant

## Solution

After investigation, the custom Jest setup with Scenarios came out as a winner. It meets all the goals outlined above, except that it's required some customization.

### Scenario

Our test suits are called Scenarios. It's a convention that does not exist in the Jest ecosystem and is different from the usual way of writing Jest tests. This is what simple Scenario looks like:

```typescript
// HappyPath.scenario.ts
import UpdateAliasTest from './tests/UpdateAlias';
import UpdateLocationTest from './tests/UpdateLocation';

const displays = /* Explained later how we get displays */

describe.each(displays)('Happy Path scenario for $id', (display) => {
  const testEnv = {
    getDisplay: () => {/* */}
    getCustomer: () => {/* */}
  };

  UpdateAliasTest(testEnv)
  UpdateLocationTest(testEnv)

})
```

```typescript
// UpdateAlias.ts
export default (testEnv) => {
  describe('Alias', () => {
    it('Changes the alias of a display', async () => {
      const display = testEnv.getDisplay();
      // The implementation omitted
    });

    it('Changes the alias of a display back to the initial value', async () => {
      // The implementation omitted
    });
  });
};
```

The biggest advantage of the Scenario structure is the ability to share the state without needing to do I/O (the usual solution is to write data in one file and the next test reads the data). This was a missing feature in a lot of the test runners that were evaluated. The second advantage is that you can order tests. Without changing the Jest Runner, Jest does not guarantee the order of test suits. This feature is more present in alternative compared to sharing state.

### Jest Setup

We use a custom jest environment(jestCustomEnvironment.ts). Before starting the Scenario run, the custom environment will fetch the displays from Graphql API and put them in the global scope of the Scenario. The advantage is that we can choose which tests we should skip for the specific display. For example, if the display does not support orientation, we can skip the tests targeting the orientation feature. It's not possible to do the same if we would fetch the displays inside the scenario as test definitions are synchronous.

The list of displays is hardcoded in jestCustomEnvironment.ts now. It's possible to choose between the hard-coded list of real displays and the simulators, using USE_REAL_DISPLAYS env variable.

## GraphQL

We use graphql-codegen to generate client sdk based on queries in apiClient/operations. On every change to files in operations, you should run the following command

```
yarn codegen
```

## Typescript

We use Typescript but with `allowJS` enabled. Fully typing the tests does not give much value and allows QA to experiment more freely. It's used to have helpful typing hints for client sdk.
