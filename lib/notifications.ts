import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

/**
 * Configure how notifications should be handled when the app is foregrounded
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Request permissions and get Expo Push Token
   */
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      
      // projectId is required for Expo Push Tokens in newer SDKs
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
    }

    return token;
  },

  /**
   * Schedules a daily reminder at 9 AM local time
   */
  async scheduleDaily9AMReminder() {
    // Clear existing daily reminders to avoid duplicates or overlapping schedules
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminderIds = scheduled
      .filter(n => n.content.title === "Daily Progress Check-in")
      .map(n => n.identifier);
    
    for (const id of reminderIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Progress Check-in",
        body: "Time for your Recovery Compass session. Take a moment for yourself today.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  },

  /**
   * Sync token to Supabase profile
   */
  async syncTokenToProfile(userId: string, token: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('[NotificationService] Error syncing token:', error.message);
    }
  },

  /**
   * Initialize all notification logic for a user
   */
  async initialize(userId: string) {
    try {
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        await this.syncTokenToProfile(userId, token);
      }
      await this.scheduleDaily9AMReminder();
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
    }
  }
};
