import React from 'react';
import { View, Text, Pressable, Switch, Platform, Alert } from 'react-native';
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
    const { notificationsEnabled, reminderTime, appLockEnabled, securityPin } = useSettings();

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
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="notifications-outline" size={14} color="#8B5CF6" />
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

                {/* App Lock */}
                <Pressable
                    onPress={onAppLockPress}
                    className="flex-row items-center justify-between p-3 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name={Platform.OS === 'web' ? "lock-closed-outline" : "finger-print-outline"} size={14} color="#EF4444" />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{Platform.OS === 'web' ? "App Lock" : "Biometric Lock"}</Text>
                            <Text className="text-xs text-gray-400">
                                {Platform.OS === 'web'
                                    ? (securityPin ? "PIN Set" : "No PIN Set")
                                    : (appLockEnabled ? "Device Security On" : "Not Enabled")
                                }
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

                {/* Reset PIN (Coming Soon) */}
                <Pressable
                    onPress={() => Alert.alert("Coming Soon", "PIN recovery options will be available in a future update.")}
                    className="flex-row items-center justify-between p-3 border-t border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="key-outline" size={14} color="#9ca3af" />
                        </View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset Security PIN</Text>
                    </View>
                    <View className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-bold text-gray-500 uppercase">SOON</Text>
                    </View>
                </Pressable>
            </View>
        </View>
    );
};
