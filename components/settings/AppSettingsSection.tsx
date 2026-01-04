import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../store/SettingsContext";

interface AppSettingsSectionProps {
    isDark: boolean;
    setShowCurrencyPicker: (val: boolean) => void;
    setShowThemePicker: (val: boolean) => void;
    setTempMaxAmount: (val: string) => void;
    setShowMaxAmountModal: (val: boolean) => void;
    isSyncing: boolean;
    handleSync: () => void;
    currencies: { symbol: string, name: string }[];
}

export const AppSettingsSection: React.FC<AppSettingsSectionProps> = ({
    isDark,
    setShowCurrencyPicker,
    setShowThemePicker,
    setTempMaxAmount,
    setShowMaxAmountModal,
    isSyncing,
    handleSync,
    currencies
}) => {
    const { currency, theme, maxAmount, lastSyncTime } = useSettings();

    return (
        <View className="mb-6">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">App Settings</Text>
            <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Currency */}
                <Pressable
                    onPress={() => setShowCurrencyPicker(true)}
                    className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{currency}</Text>
                        </View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-gray-400 mr-1">{currencies.find(c => c.symbol === currency)?.name}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                    </View>
                </Pressable>

                {/* Theme */}
                <Pressable
                    onPress={() => setShowThemePicker(true)}
                    className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="moon-outline" size={14} color={isDark ? '#9ca3af' : '#1F2937'} />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</Text>
                            <Text className="text-[10px] text-gray-400 capitalize">{theme}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </Pressable>

                {/* Max Transaction Amount */}
                <Pressable
                    onPress={() => {
                        setTempMaxAmount(maxAmount.toString());
                        setShowMaxAmountModal(true);
                    }}
                    className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Limit</Text>
                            <Text className="text-[10px] text-gray-400">{currency}{maxAmount.toLocaleString()}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </Pressable>

                {/* Sync Data */}
                <Pressable
                    onPress={handleSync}
                    disabled={isSyncing}
                    className="flex-row items-center justify-between p-3 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="cloud-upload-outline" size={14} color="#2563eb" />
                        </View>
                        <View>
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Cloud Sync</Text>
                            {lastSyncTime && (
                                <Text className="text-[10px] text-gray-400">
                                    Synced {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                        </View>
                    </View>
                    {isSyncing ? (
                        <Text className="text-xs text-gray-400 italic">Syncing...</Text>
                    ) : (
                        <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                    )}
                </Pressable>
            </View>
        </View>
    );
};
