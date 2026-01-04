import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../store/SettingsContext";

export const PremiumSection: React.FC = () => {
    // START: Refreshing Hook Usage
    const settings = useSettings();
    const isPremium = settings?.isPremium ?? false;
    const updateSettings = settings?.updateSettings ?? (() => { });
    // END: Hook Usage

    const handleActivatePro = () => {
        updateSettings({ isPremium: true });
        // In a real app, this would trigger a payment gateway
        // Alert.alert("Success!", "You are now a DailyXpense Pro member for life! 💎🚀");
    };

    return (
        <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Premium Experience</Text>
                <View className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                    <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">PRO</Text>
                </View>
            </View>

            {/* Main Pro Call to Action */}
            {!isPremium ? (
                <Pressable
                    onPress={handleActivatePro}
                    className="bg-amber-500 rounded-2xl p-5 mb-4 shadow-lg shadow-amber-500/30 active:scale-[0.98] overflow-hidden"
                >
                    <View className="flex-row justify-between items-center z-10">
                        <View className="flex-1 mr-4">
                            <Text className="text-white font-black text-xl mb-1">Upgrade to Premium</Text>
                            <Text className="text-white/80 text-xs font-semibold">Unlock Spend Review Pro, PDF Reports, and Cloud Sync for life.</Text>
                        </View>
                        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                            <Ionicons name="sparkles" size={24} color="white" />
                        </View>
                    </View>
                    <View className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                </Pressable>
            ) : (
                <View className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-4 mb-4 flex-row items-center">
                    <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center mr-3">
                        <Ionicons name="star" size={20} color="white" />
                    </View>
                    <View>
                        <Text className="text-amber-700 dark:text-amber-400 font-black text-sm uppercase tracking-tighter">Lifetime Member</Text>
                        <Text className="text-amber-600/60 dark:text-amber-500/40 text-[10px] font-bold">Thank you for supporting DailyXpense</Text>
                    </View>
                    <View className="ml-auto bg-amber-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Active</Text>
                    </View>
                </View>
            )}

            <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-amber-100 dark:border-amber-900/20">
                {/* AI Smart Insights */}
                <View className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="analytics-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Spend Review Pro</Text>
                            <Text className="text-[10px] text-gray-400">Advanced spending analysis & trends</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <Text className="text-[10px] font-bold text-green-600 dark:text-green-400 mr-1">
                            Enabled
                        </Text>
                    </View>
                </View>

                {/* Advanced Categories (Coming Soon) */}
                <View className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 opacity-60">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="grid-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Advanced Categories</Text>
                            <Text className="text-[10px] text-gray-400">Custom icons & unlimited groups</Text>
                        </View>
                    </View>
                    <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">SOON</Text>
                    </View>
                </View>

                {/* Automatic Cloud Sync */}
                <View className="flex-row items-center justify-between p-3">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="cloud-done-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Automatic Cloud Sync</Text>
                            <Text className="text-[10px] text-gray-400">Real-time sync & secure backups</Text>
                        </View>
                    </View>
                    {isPremium ? (
                        <View className="flex-row items-center">
                            <Switch
                                value={settings?.automaticCloudSync ?? true}
                                onValueChange={(val) => updateSettings({ automaticCloudSync: val })}
                                trackColor={{ false: '#d1d5db', true: '#f59e0b' }}
                                thumbColor={'white'}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>
                    ) : (
                        <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                            <Ionicons name="lock-closed" size={8} color="#d97706" />
                            <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">PRO</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};
