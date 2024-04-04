import { client } from '../../apiClient/client';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  describe('UpdateGroup', () => {
    let groups;
    let createdGroup;
    const display = testEnv.getDisplay();

    //from graphql we are fetching the data of all groups 
    //The beforeAll hook is used to fetch data about all groups associated with a customer using client.getAllGroups()
    //This hook is executed before any test cases within the corresponding describe block are run. It's often used for setup tasks that need to be performed once before the entire suite of tests
    beforeAll(async () => {
      const data = await client.getAllGroups({ customerId: testEnv.getCustomer().id });
      // the above data is used to traverse till groups in graph ql 
      groups = data.customer.groups;
    });

    //Create a new group
    it('Create a new group', async () => {
      testEnv.log.Info('Running test: ' + testName);
      //
      groups.forEach((group) => {
        //it checks if the group's name is equal to 'E2EAutomatedTest'. If such a group is found, its id is assigned to the variable createdGroup. This loop essentially searches for a group with a specific name in the array and sets createdGroup to the id of the found group if it exists.
        if (group.name == 'E2EAutomatedTest') {
          createdGroup = group.id;
        }
      });

      if (createdGroup == null) {
        //The await keyword is used to wait for the asynchronous operation to complete. This operation likely involves making an API request to create a group.
        //{ groupCreate } is a destructuring assignment syntax in JavaScript. It is used to extract a property named groupCreate from the object returned by the asynchronous operation.
        // to access the specific property (here : groupCreate) from the client.createGroup
        const { groupCreate } = await client.createGroup({
          //The createGroup operation is awaited to ensure the asynchronous operation is completed before proceeding.
          //The response object is destructured to extract the groupCreate property.
          //groupCreate likely contains information about the newly created group.
          input: {
            customerId: testEnv.getCustomer().id,
            name: 'E2EAutomatedTest',
          },
        });
        createdGroup = groupCreate.group.id;
        //After this line, you can use the groupCreate variable to access properties related to the created group. For example, if groupCreate is an object like { group: { id: 'someId', name: 'groupName' }, otherProperty: 'value' }, then groupCreate would be { id: 'someId', name: 'groupName' }, and you could access groupCreate.group.id to get the ID of the created group.
      }
    });

    //Update the group of the display or adding a group 
    it('Changes the group of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      //const response = await client.addGroup({ ... }); makes an API call to add the created group to the display. The response is stored in the response variable.
      // now in response we have displayId and GroupId
      const response = await client.addGroup({
        input: { displayId: testEnv.getDisplay().id, groupId: createdGroup },//we arew taking the group from the above created group we are taking group id 
      });

      const groups = response.displayAddGroup.groups;
      // and now the response is stored in the groups 

      //const groups = response.displayAddGroup.groups; extracts the groups property from the API response, which likely contains information about groups associated with the display.
      testEnv.log.Response(testName, JSON.stringify(response));
      
      //The testResult object is updated with information about the test, including the test name, expected result (created group ID), and actual result (ID of the group found in the response).
      testResult.test = testName;
      testResult.expectedResult = createdGroup;
      testResult.actualResult = groups.find((group) => group.id === createdGroup).id;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(groups.find((group) => group.id === createdGroup)).not.toBeUndefined(); //it expects that it should not tobeUndefined 
      //The find method is called on the groups array. It takes a callback function as an argument.
      //The callback function (group) => group.id === createdGroup is a condition that checks if the id property of each group object in the array is equal to the value of createdGroup.
      //The find method returns the first element in the array that satisfies the provided callback condition. If no element is found, it returns undefined
    });

    //Remove the group from the display, subsequently also deleting the group itself or deleting a group 
    // we are accessing deleteGroup in graphql 
    it('Deletes the group of a display', async () => {
      testEnv.log.Info('Clean up of test: ' + testName);
      await client.deleteGroup({
        input: { displayId: testEnv.getDisplay().id, groupId: createdGroup },
      });
    });
  });
};
