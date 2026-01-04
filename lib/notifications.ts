import { Platform, LogBox } from 'react-native';

// Suppress the specific Expo Go warning here as well, just in case
LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
]);

import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Helper to safely get the Notifications module.
 * On Android Expo Go, this might trigger a warning/error about Push Notifications.
 */
function getNotificationsModule() {
    if (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        // Expo Go Android detected. Block loading to prevent crash.
        return null;
    }

    try {
        const Notifications = require('expo-notifications');
        return Notifications;
    } catch (e) {
        console.warn("Failed to load expo-notifications:", e);
        return null;
    }
}

export function isNotificationSupported(): boolean {
    if (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        return false;
    }
    return true;
}

// Configured flag to avoid repeatedly setting handler
let isConfigured = false;

function ensureConfiguration() {
    if (isConfigured) return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    // Configure Expo Notifications behavior (Mobile)
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    isConfigured = true;
}

/**
 * Registers for push notifications.
 * - Mobile: Requests permission via Expo.
 * - Web: Requests permission via Browser API.
 * @returns {Promise<boolean>} permission granted status
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notifications");
            return false;
        }

        if (Notification.permission === "granted") {
            return true;
        }

        const permission = await Notification.requestPermission();
        return permission === "granted";
    } else {
        // Android/iOS
        const Notifications = getNotificationsModule();
        if (!Notifications) return false;

        ensureConfiguration();

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            return finalStatus === 'granted';
        } catch (e) {
            console.warn("Error requesting notification permissions:", e);
            return false;
        }
    }
}

/**
 * Schedules a local notification.
 * - Mobile: Uses Expo Notifications.
 * - Web: Uses Browser Notification API.
 */
export async function scheduleLocalNotification(title: string, body: string, triggerSeconds: number = 1) {
    if (Platform.OS === 'web') {
        if (Notification.permission === "granted") {
            setTimeout(() => {
                new Notification(title, { body });
            }, triggerSeconds * 1000);
        }
    } else {
        const Notifications = getNotificationsModule();
        if (!Notifications) return;

        ensureConfiguration();

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                },
                trigger: {
                    seconds: triggerSeconds,
                } as any,
            });
        } catch (e) {
            console.warn("Error scheduling notification:", e);
        }
    }
}

/**
 * Checks current permission status without prompting.
 */
export async function checkPermissionStatus(): Promise<boolean> {
    if (Platform.OS === 'web') {
        return Notification.permission === "granted";
    } else {
        const Notifications = getNotificationsModule();
        if (!Notifications) return false;

        try {
            const { status } = await Notifications.getPermissionsAsync();
            return status === 'granted';
        } catch (e) {
            // If it crashes on Expo Go Android due to the Push check, we shouldn't crash the app.
            console.warn("Check permission failed:", e);
            return false;
        }
    }
}
