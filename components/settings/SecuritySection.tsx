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
                    onPress={() => {
                        if (notificationsEnabled) onTimePickerPress();
                    }}
                    className={`flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 relative ${notificationsEnabled ? 'active:bg-gray-100 dark:active:bg-gray-800' : 'opacity-80'}`}
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mr-3">
                            <Ionicons name="notifications-outline" size={14} color="#3b82f6" />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Reminders</Text>
                            {notificationsEnabled && (
                                <Text className="text-[10px] text-gray-400">
                                    Push Notification enabled
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

                {/* Biometric Lock (Mobile Only / Visible on Web) */}
                {((Platform.OS !== 'web' && isBiometricSupported) || Platform.OS === 'web') && (
                    <View className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 opacity-100">
                        <View className="flex-row items-center">
                            <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                                <Ionicons name="finger-print-outline" size={14} color={Platform.OS === 'web' ? "#9ca3af" : "#ec4899"} />
                            </View>
                            <View>
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Biometric Access</Text>
                                    {Platform.OS === 'web' && (
                                        <View className="flex-row items-center bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/50">
                                            <Ionicons name="phone-portrait-outline" size={8} color="#818cf8" style={{ marginRight: 3 }} />
                                            <Text className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 tracking-wide">MOBILE ONLY</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-xs text-gray-400">FaceID / Fingerprint</Text>
                            </View>
                        </View>
                        <Switch
                            value={biometricsEnabled}
                            disabled={!securityPin || Platform.OS === 'web'}
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
