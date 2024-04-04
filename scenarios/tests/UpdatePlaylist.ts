import { client, poll } from '../../apiClient/client';
import { Log } from '../../utils/Log';
import { describeIf } from '../../utils/describeIf';

export default (testEnv, testResult, testName = 'undefined') => {
  const bIsProTV = testEnv.getDisplay().alias.toUpperCase().includes('BFL');//include statements will check if BFL is present inside that string and returns a boolean value 
  //This calls the getDisplay method on the testEnv object, presumably to obtain information about a display.
  //alias: Assuming that the result of testEnv.getDisplay() has a property named alias, this accesses the alias property of the display.
  //.toUpperCase():This method is called on the alias property. It converts the entire string to uppercase.
  //.includes('BFL'):This checks if the uppercase alias string includes the substring 'BFL'.
  // If the string contains the substring, it evaluates to true; otherwise, it evaluates to false
  // const bIsProTV = ...:The result of the above operations is assigned to the variable bIsProTV.
  // This variable is likely a boolean indicating whether the display's alias contains the substring 'BFL' (case-insensitive).

  describeIf(!bIsProTV)('UpdatePlaylist', () => {
    let availablePlaylists = null;
    let targetPlaylist = null;
    const display = testEnv.getDisplay();

    //Sync a random playlist
    it('Syncs a new playlists to the display', async () => {
      testEnv.log.Info('Running test: ' + testName);
      const display = testEnv.getDisplay();

      const response = await client.getPlaylists({ customerHandle: testEnv.getCustomer().handle });
      availablePlaylists = response.customer.playlists; //graphql fetch

      var activePlaylist = display.playlist.source;//currently running play list 

      if (activePlaylist) {
        for (var i = 0; i < availablePlaylists.length; i++) {
          if (availablePlaylists[i].id === activePlaylist.id) { //checking available playlists checking is equal to current playlist
            availablePlaylists.splice(i, 1); //it will remove the current play list 
          }
        }
      }

      //Filter out playlists that are larger than 300MB
      var acceptableSizePlaylists = availablePlaylists.filter(
        (playlist) => playlist.size < 300000000,
      );

      //Select a random playlist
      var random = Math.floor(Math.random() * acceptableSizePlaylists.length);
      targetPlaylist = acceptableSizePlaylists[random];

      try {
        const updateResponse = await client.updatePlaylist({
          input: { displayIds: display.id, playlistId: targetPlaylist.id },
        });
        const jobStatus = updateResponse.displayBulkUpdatePlaylist.__typename;
        expect(jobStatus === 'DisplayBulkUpdatePlaylistPayload').toBe(true);
      } catch (err) {
        console.log(err);
      }
    });

    //Verify the synced playlist is the desired one
    it('Validates the playlist of a display', async () => {
      testEnv.log.Info('Validating test: ' + testName);
      testResult.test = testName;
      testResult.expectedResult = targetPlaylist.id;

      try {
        const response = await poll(
          () => client.getDisplay({ displayId: testEnv.getDisplay().id }),
          (response) => {
            return (
              response.display.playlist.current !== null &&
              response.display.playlist.current.id == targetPlaylist.id
            );
          },
        );

        testEnv.log.Response(testName, JSON.stringify(response));
        testResult.actualResult = response.display.playlist.current.id;

        expect(testResult.actualResult).toEqual(testResult.expectedResult);
      } catch (err) {
        testResult.actualResult = 'Timed out polling for status to be changed.';
        //Null as response invalidates test result
        if (testResult.actualResult != null) {
          expect(testResult.actualResult).toEqual(testResult.expectedResult);
          return;
        }
      }
    });
  });
};
