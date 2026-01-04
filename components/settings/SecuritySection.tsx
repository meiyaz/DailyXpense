import React from 'react';
import { View, Text, Pressable, Switch, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../store/SettingsContext";
import * as LocalAuthentication from 'expo-local-authentication';

interface SecuritySectionProps {
    handleToggleNotifications: (val: boolean) => void;
    onTimePickerPress: () => void;
    onAppLockPress: () => void;
    onAppLockSwitch: (val: boolean) => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
    handleToggleNotifications,
    onTimePickerPress,
    onAppLockPress,
    onAppLockSwitch
}) => {
    const {
        notificationsEnabled,
        reminderTime,
        appLockEnabled,
        securityPin,
        biometricsEnabled,
        updateSettings
    } = useSettings();

    const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);

    React.useEffect(() => {
        if (Platform.OS !== 'web') {
            LocalAuthentication.hasHardwareAsync().then(setIsBiometricSupported);
        }
    }, []);

    return (
        <View className="mb-6">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Security & Notifications</Text>
            <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Daily Reminders */}
                <Pressable
                    onPress={onTimePickerPress}
                    className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800 relative"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mr-3">
                            <Ionicons name="notifications-outline" size={14} color="#3b82f6" />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Reminders</Text>
                            {notificationsEnabled && (
                                <Text className="text-[10px] text-gray-400">
                                    {(Platform.OS as string) === 'web' ? "Coming Soon" : "Push Notification enabled"}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {notificationsEnabled && (
                            <Text className="text-xs text-gray-400">
                                {(() => {
                                    const [h, m] = reminderTime.split(':').map(Number);
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    const h12 = h % 12 || 12;
                                    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
                                })()}
                            </Text>
                        )}
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                            thumbColor={"white"}
                        />
                    </View>
                </Pressable>

                {/* PIN Security */}
                <Pressable
                    onPress={onAppLockPress}
                    className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="lock-closed-outline" size={14} color="#6366f1" />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">App PIN Security</Text>
                            <Text className="text-xs text-gray-400">
                                {securityPin ? "Change 4-digit PIN" : "No PIN Set"}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={appLockEnabled}
                        onValueChange={onAppLockSwitch}
                        trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                        thumbColor={"white"}
                    />
                </Pressable>

                {/* Biometric Lock (Mobile Only) */}
                {Platform.OS !== 'web' && isBiometricSupported && (
                    <View className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                        <View className="flex-row items-center">
                            <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                                <Ionicons name="finger-print-outline" size={14} color="#ec4899" />
                            </View>
                            <View>
                                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Biometric Access</Text>
                                <Text className="text-xs text-gray-400">FaceID / Fingerprint</Text>
                            </View>
                        </View>
                        <Switch
                            value={biometricsEnabled}
                            disabled={!securityPin}
                            onValueChange={async (val) => {
                                if (val) {
                                    const result = await LocalAuthentication.authenticateAsync({
                                        promptMessage: 'Enable biometrics for DailyXpense',
                                    });
                                    if (result.success) {
                                        updateSettings({ biometricsEnabled: true, appLockEnabled: true });
                                    }
                                } else {
                                    updateSettings({ biometricsEnabled: false });
                                }
                            }}
                            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                            thumbColor={"white"}
                        />
                    </View>
                )}

                {/* Security Info */}
                <View className="p-3 bg-gray-50/50 dark:bg-gray-800/20">
                    <Text className="text-[9px] text-gray-400 italic">
                        Securing your wallet helps protect your data if your device is lost or shared.
                    </Text>
                </View>
            </View>
        </View>
    );
};
