import * as Notifications from 'expo-notifications';

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
   * Initialize local notification logic for a user.
   * Remote push token registration is handled by usePushNotifications/ProfileProvider.
   */
  async initialize() {
    try {
      await this.scheduleDaily9AMReminder();
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
    }
  }
};
