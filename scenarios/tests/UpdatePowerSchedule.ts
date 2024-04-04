import { client, poll } from '../../apiClient/client';
import { Log } from '../../utils/Log';

export default (testEnv, testResult, testName = 'undefined', schedule = null) => {
  describe('UpdatePowerSchedule', () => {
    let availableSchedules = null;
    let targetSchedule = schedule;
    const display = testEnv.getDisplay();

    //Sync a random power schedule
    it('Syncs a new power schedule to the display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const display = testEnv.getDisplay();

      const response = await client.getPowerSchedules({
        customerHandle: testEnv.getCustomer().handle,
      });
      availableSchedules = response.customer.powerSchedules; //available  running schedules 

      let activeSchedule; //activeschedules 

      if (display.powerSchedule != null && display.powerSchedule.schedule != null) {
        activeSchedule = display.powerSchedule.schedule.id;//fetching the id if it is not null 
      }

      if (activeSchedule) {
        for (var i = 0; i < availableSchedules.length; i++) { //checking for the list of availableSchedules
          if (availableSchedules[i].id === activeSchedule.id) {
            availableSchedules.splice(i, 1); //the currently running or active schedule we will delete that splice will delete
          }
        }
      }
      if (targetSchedule == null) {
        var random = Math.floor(Math.random() * availableSchedules.length);
        targetSchedule = availableSchedules[random]; //randomly picking and storing it in targetschedule 
      }

      try {
        const updateResponse = await client.BulkUpdatePowerSchedule({
          input: { displayIds: display.id, powerScheduleId: targetSchedule.id },//powerScheduleId is a variable storing targetschedule.id of that
        });
        const jobStatus =
          updateResponse.displayBulkUpdatePowerSchedule.displays[0].powerSchedule.latestJob
            .__typename;
        expect(jobStatus === 'PowerScheduleUpdateInProgress').toBe(true);
      } catch (err) {
        console.log(err);
      }
    });

    //Verify the synced power schedule is the desired one
    it('Validates the power schedule of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetSchedule.id;

      try {
        const response = await poll(
          () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
          (response) => {
            return (
              response.display.powerSchedule.latestJob.__typename === 'PowerScheduleUpdateCompleted'
            );
          },
        );

        testEnv.log.Response(testName, JSON.stringify(response));
        testResult.actualResult = response.display.powerSchedule.schedule.id;

        expect(testResult.actualResult).toEqual(testResult.expectedResult);
      } catch (err) {
        if (testResult.actualResult != null) {
          testResult.actualResult = 'Error: ' + err;
          expect(testResult.actualResult).toEqual(testResult.expectedResult);
        }
      }
    });
  });
};
