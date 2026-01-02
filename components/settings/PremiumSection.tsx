import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface PremiumSectionProps {
    setShowExportModal: (val: boolean) => void;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({
    setShowExportModal
}) => {
    return (
        <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Premium Features</Text>
                <View className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                    <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">PRO</Text>
                </View>
            </View>
            <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-amber-100 dark:border-amber-900/20">
                {/* Export Data */}
                <Pressable
                    onPress={() => setShowExportModal(true)}
                    className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 active:bg-amber-50 dark:active:bg-amber-900/10"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="share-social-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Export Data</Text>
                            <Text className="text-[10px] text-gray-400">PDF, Excel & WhatsApp sharing</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mr-1">Active</Text>
                        <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
                    </View>
                </Pressable>

                {/* AI Smart Insights (Coming Soon) */}
                <View className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 opacity-60">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="analytics-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">AI Smart Insights</Text>
                            <Text className="text-[10px] text-gray-400">Advanced spending analysis & trends</Text>
                        </View>
                    </View>
                    <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">SOON</Text>
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

                {/* Cloud Sync Pro (Coming Soon) */}
                <View className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 opacity-60">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="sync-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Cloud Sync Pro</Text>
                            <Text className="text-[10px] text-gray-400">Real-time sync across all devices</Text>
                        </View>
                    </View>
                    <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">SOON</Text>
                    </View>
                </View>

                {/* Auto Backup (Coming Soon) */}
                <View className="flex-row items-center justify-between p-3 opacity-60">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="cloud-done-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Auto-Cloud Backup</Text>
                            <Text className="text-[10px] text-gray-400">Scheduled secure backups</Text>
                        </View>
                    </View>
                    <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">SOON</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};
