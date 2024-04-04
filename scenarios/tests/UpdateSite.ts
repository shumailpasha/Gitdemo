import { client } from '../../apiClient/client';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined') => {
  describe('UpdateSite', () => {
    let sites;
    const display = testEnv.getDisplay();

    beforeAll(async () => {
      const response = await client.getSites({ customerHandle: testEnv.getCustomer().handle });
      sites = response.customer.sites;//here we have list of sites 
    });

    //Change the site to a random site
    it('Changes the site of a display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const initialDisplayState = testEnv.getDisplay();//currently displaying state
      var currentSite = initialDisplayState.site.id;
      for (var i = sites.length - 1; i >= 0; --i) {// we are iterating through each site 
        if (sites[i].id === currentSite) {
          sites.splice(i, 1);//we are deleting the site which is currently running 
        }
      }
      
      //and here we are picking the random, site 
      const random = Math.floor(Math.random() * sites.length);
      var randomsite = sites[random].id;
      const response = await client.UpdateSite({
        input: {
          displayId: initialDisplayState.id,
          siteId: randomsite,
        },
      });

      testEnv.log.Info('Validating test: ' + testName);
      testEnv.log.Response(testName, JSON.stringify(response));
      testResult.test = testName;
      testResult.expectedResult = randomsite;
      testResult.actualResult = response.displayUpdateSite.site.id;
      //Null as response invalidates test result
      if (testResult.actualResult == null) {
        return;
      }
      expect(response.displayUpdateSite.site.id).toEqual(randomsite);
    });
  });
};
