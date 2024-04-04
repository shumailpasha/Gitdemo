import { SubscriptionArgs } from 'graphql';
import {
  Bookmarks,
  ContentSource,
  DisplayAppSubscription,
  DisplaySubscriptionsFragment,
  GetDisplayQuery,
  Group,
  Orientation,
  Playlist,
  PlaylistContentSource,
  Power,
  PowerSchedule,
  ReleaseChannel,
  Site,
  TimeZoneState,
  Volume,
  VolumeLevelState,
  VolumeMuteState,
} from '../apiClient/sdk';
import UpdateVolumeLevel from '../scenarios/tests/UpdateVolumeLevel';

/**
 * Display type in graphql schema includes the desired and reported states
 * and fields can be quite nested.
 * Display class tried to extract reported values and make them top level fields
 */
export class Display {
  constructor(graphqlDisplay: GetDisplayQuery['display']) {
    this.id = graphqlDisplay.id;
    this.alias = graphqlDisplay.alias;
    this.power = graphqlDisplay.power.reported;
    this.volume = graphqlDisplay.volume.level?.reported;
    /*
    This block checks if the isMuted property in graphqlDisplay.volume is not null. 
    If not null, it assigns its reported value to this.isMuted and sets this.supportsMute to true.
    */
    if ((this.isMuted = graphqlDisplay.volume.isMuted !== null)) {
      this.isMuted = graphqlDisplay.volume.isMuted.reported;
      this.supportsMute = true;
    }
    /*
    these check for the existence of minimum and maximum volume limits and assign their 
    reported values to this.minVolume and this.maxVolume respectively.
    */
    if (graphqlDisplay.volume.limits.min !== null) {
      this.minVolume = graphqlDisplay.volume.limits.min.reported;
    }
    if (graphqlDisplay.volume.limits.max !== null) {
      this.maxVolume = graphqlDisplay.volume.limits.max.reported;
    }
    if (graphqlDisplay.orientation !== null) {
      this.orientation = graphqlDisplay.orientation.reported;
      this.supportsOrientation = true;
    }
    this.agentVersion = graphqlDisplay.agentVersion;
    if (
      Array.isArray(graphqlDisplay.contentSource.available) &&
      graphqlDisplay.contentSource.available.length !== 0
    ) {
      this.availableContentSources = graphqlDisplay.contentSource.available;
    }
    this.contentSource = graphqlDisplay.contentSource.current.reported;

    if (graphqlDisplay.site != null && graphqlDisplay.site.id != null) {
      this.site = graphqlDisplay.site;
    } else {
      this.site = null;
    }
    if (graphqlDisplay.timeZone != null && graphqlDisplay.timeZone.reported != null) {
      this.timeZone = graphqlDisplay.timeZone.reported;
    } else {
      this.timeZone = 'UNSUPPORTED';
    }

    this.agentReleaseChannel = graphqlDisplay.agentReleaseChannel.reported;
    this.groups = graphqlDisplay.groups;
    this.bookmarks = graphqlDisplay.bookmarks;

    if (graphqlDisplay.infraRedControl != null) {
      this.supportsControlLocking = true;
      this.infraRedControl = graphqlDisplay.infraRedControl.reported;
      this.keyboardControl = graphqlDisplay.keyboardControl.reported;
    }

    if (graphqlDisplay.portsControl != null) {
      this.supportsUSBControlLocking = true;
      this.USBControl = graphqlDisplay.portsControl.reported;
    }

    if (graphqlDisplay.ledStripColor != null) {
      this.supportsLedStripColor = true;
      this.ledStripColor = graphqlDisplay.ledStripColor.reported;
    }

    this.powerSchedule = graphqlDisplay.powerSchedule;

    this.playlist = graphqlDisplay.playlist;
    this.isOnline = graphqlDisplay.presence.connected;
    this.testAppSubscription = graphqlDisplay.appSubscriptions.filter(
      (sub) => sub.id == this.testAppSubscriptionId,
    )[0];

    if (
      graphqlDisplay.contentSource.available.filter(
        (contentSource) =>
          contentSource.__typename === 'AppContentSource' &&
          contentSource.applicationId === this.testApplicationId,
      ).length > 0
    ) {
      this.testAppInstalled = true;
    }
  }

  id: string;
  power: Power;
  powerMode: string;
  agentVersion: string;
  alias: string;
  site: Site;
  groups: Group[];
  contentSource: ContentSource;
  availableContentSources: ContentSource[];
  bookmarks: Bookmarks;
  playlist;
  volume: number = 50;
  minVolume: number = 0;
  maxVolume: number = 100;
  isMuted = null;
  orientation: Orientation = Orientation.Landscape;
  availableInputSources;
  timeZone;
  isOnline;
  supportsMute;
  infraRedControl;
  keyboardControl;
  USBControl;
  ledStripColor;
  powerSchedule;
  supportsControlLocking;
  supportsUSBControlLocking;
  supportsLedStripColor;
  supportsOrientation;
  agentReleaseChannel: ReleaseChannel = ReleaseChannel.Stable;
  testApplicationId = 'com.ppds.professionalapps.displayinfo';
  testAppSubscriptionId = '70178859-832c-4a2c-9cd4-0f185bf7bea0';
  testAppInstalled = false;
  testAppSubscription;
}
