import NodeEnvironment from 'jest-environment-node';
import { client } from './apiClient/client';
import env from 'env-var';
import { stringify } from 'ts-jest';
import { Log } from './utils/Log';
import { ReleaseChannel } from './apiClient/sdk';

const USE_REAL_DISPLAYS = env.get('USE_REAL_DISPLAYS').asBool();

// basically hardcoding the display IDs of real_displays and simulators 

const REAL_DISPLAYS = [
  '02bbc59e-11c7-4873-b52a-3bf6369a599f', //BFL008 TPM181HE
  '0d59820d-2cfe-44f6-b5fe-fbed8b643ba7', //Sig037 BDL4051D
  'e9289e19-1a69-44a7-9b5c-38baec0857f5', //Sig042 BDL3550Q
  'da3ecad5-25d4-403d-b9a1-c3076ae69eb8', //Sig105 BDL3552T
  'c702ff71-419b-4327-872c-c14b51d78983', //Sig138 10BDL4551T
  '674c2d99-a6f6-44a4-b02a-bdc37a40b702', //Sig144 BDL8051C
  'ec31bb45-72ea-4eaa-ae81-08cf15687129', //Sig149 BDL4150D
  '406c5059-6b6f-4155-a2f3-7ba824e21c4c', //Sig158 BDL4550D
  'e3ac868f-320f-45f9-8e77-2d3e87f0a98a', //Sig262 BDL3651T
  //'38e618f2-2089-420f-aec8-f94f21960479', //Sig183
  //'9026c69c-9b5f-4d07-9cd3-3f14d023c0d9', //Sig235
  //'741e427a-6c53-437e-8b84-3ee86b08e9f6', //Sig236 43BDL2050Q
  //'97e31523-b8f9-466a-b48d-420120d6f966', //Sig224 BDL3652T
  '2b417f95-df0c-48ff-9c13-a2514e23d334', //Sig260 BDL3052E
  '73ee9f2e-d1a3-40f8-999c-8e7e4aaadf2c', //Sig266 BDL3050S
  '79e99195-8f3a-416b-a90e-7e7278685b21', //Sig281 BDL4052E
  '847a695f-f3c0-44da-a0eb-a30058c21cd9', //Sig283 BDL3650Q
  '68704c89-863f-4221-ad4e-b5e28306ae6d', //Sig082 BDL6051C
  'bea13576-01a1-4d0b-97a9-415ef708cb8c', //Sig287 BDL4650D
  'cfe02659-dcc1-4e9c-8f08-995458063c0f', //4052E/02
  //'5be858f2-e012-41eb-8be9-701910a6d6dd', //Sig289 BDL3650QE
  /*'ce62a1ff-5f7f-4164-8055-762eb9c40899', //Videowall Xline
  'ffc3adb9-3409-426d-b38e-7f6849338889', //Videowall Dline*/
];

const SIMULATORS = ['6b27f3df-0164-4441-9a1d-4d2513dd8295'];

class CustomEnvironment extends NodeEnvironment {
  displayIds: string[];
  testFarmHandle: string;
  constructor(config) {
    super(config);

    // here we are checking if the USE_REAL_DISPLAYS is true then sets displayIds to REAL_DISPLAYS.
    // if it false it will set the sets displayIds to SIMULATORS.
    if (USE_REAL_DISPLAYS) {
      console.log('Running tests for hard-coded real displays', {
        displays: REAL_DISPLAYS,
      });
      this.displayIds = REAL_DISPLAYS;
    } else {
      console.log('Running tests for hard-coded simulators', {
        displays: SIMULATORS,
      });
      this.displayIds = SIMULATORS;
    }
    this.testFarmHandle = 'ghent-test-farm'; //we have declared it as the string 
    this.global.__TESTFARMHANDLE__ = this.testFarmHandle; 
    //Sets __TESTFARMHANDLE__ in the global object to 'ghent-test-farm'.
    // __TESTFARMHANDLE__ in the global object.The use of double underscores (__) in the property name 
    // is a common convention to avoid potential naming conflicts with other properties.
  }
  async setup() {
    this.global.__TESTFARMHANDLE__ = 'ghent-test-farm';
    let availableDisplays = [];

    if (this.displayIds == SIMULATORS) {
      availableDisplays = this.displayIds;
    } else {
      // will check the display based on customer using graphQL client fetch the data
      let displaysForCustomer = await client.getDisplaysPerCustomer({
        customerHandle: this.testFarmHandle,
      });
      //Fetching Display Information:
      // Iterates over displayIds and filters displays based on matching IDs.
      this.displayIds.forEach(function (id) {
        displaysForCustomer.customer.displays.forEach(function (display) {
          if (id == display.id) {
            availableDisplays.push(id);//here we are pushing the availableDisplays to array 
          }
        });
      });
    }

    //This block uses Promise.all to asynchronously fetch information about each display in availableDisplays.
  	// For each id in availableDisplays, it calls client.getDisplay({ displayId: id }) to fetch the display information.
    // The then block extracts the display property from the response and creates an array of promises.
    // The await Promise.all(...) ensures that all promises are resolved before moving to the next step.
    let displays = await Promise.all(
      availableDisplays.map((id) =>
        client.getDisplay({ displayId: id }).then((res) => res.display),
      ),
    );

    //"Set release channel of all online displays to alpha"
    // For each display in the displays array, it checks if the display is connected (display.presence.connected == true).
    // If connected, it calls client.UpdateAgentReleaseChannel to set the release channel to alpha for that display.
    // The results are collected into an array of promises, and Promise.all ensures that all promises are resolved before moving on.
    await Promise.all(
      displays.map((display) => {
        // here we are only checking for the displays which are connected if it is true 
        if (display.presence.connected == true) {
          return client.UpdateAgentReleaseChannel({
            input: {
              displayIds: [display.id],
              releaseChannel: ReleaseChannel.Alpha,
            },
          });
        }

        return Promise.resolve();
      }),
    );

    // Similar to the previous block, this fetches information about each display in availableDisplays 
    // and assigns the result to this.global.__DISPLAYS__.
    this.global.__DISPLAYS__ = await Promise.all(
      availableDisplays.map((id) =>
        client.getDisplay({ displayId: id }).then((res) => res.display),
      ),
    );
  }
}

module.exports = CustomEnvironment;
// In summary, this code is part of the Jest environment setup. It fetches information about available displays, 
// sets the release channel for connected displays to alpha, and stores display information 
// in this.global.__DISPLAYS__ for use in the test suite.


