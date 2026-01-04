import { View, Text, Pressable, Switch, Modal, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../store/SettingsContext";
import { useState } from 'react';

interface PremiumSectionProps {
    showCustomAlert?: (title: string, message: string, icon: any, buttons: any[]) => void;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ showCustomAlert }) => {
    // START: Refreshing Hook Usage
    const settings = useSettings();
    const isPremium = settings?.isPremium ?? false;
    const updateSettings = settings?.updateSettings ?? (() => { });
    const [isProcessing, setIsProcessing] = useState(false);
    // END: Hook Usage

    const handleActivatePro = () => {
        setIsProcessing(true);
        // Simulate Payment Processing
        setTimeout(() => {
            setIsProcessing(false);
            updateSettings({ isPremium: true, automaticCloudSync: true });
            // Alert.alert("Welcome to Pro!", "You are now a DailyXpense Pro member for life! 💎🚀");
        }, 2000);
    };

    const handleExportData = async () => {
        if (!isPremium) return;
        try {
            await Share.share({
                message: 'Date,Category,Amount\n2025-01-01,Food,50.00\n2025-01-02,Transport,20.00\n2025-01-03,Entertainment,100.00',
                title: 'DailyXpense_Report.csv'
            });
        } catch (error) {
            Alert.alert("Error", "Could not share file.");
        }
    };

    const handleDebugRevert = () => {
        const revertAction = () => {
            // 1. Show Processing Modal to stabilize UI
            setIsProcessing(true);

            // 2. Wait for Alert to close and Modal to mount
            setTimeout(() => {
                updateSettings({ isPremium: false });

                // 3. Hide Modal after state settles
                setTimeout(() => {
                    setIsProcessing(false);
                }, 500);
            }, 500);
        };

        if (showCustomAlert) {
            showCustomAlert(
                "Debug Menu",
                "Revert to Free Tier?",
                "construct",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Disable Pro",
                        style: "destructive",
                        onPress: revertAction
                    }
                ]
            );
        } else {
            Alert.alert(
                "Debug Menu",
                "Revert to Free Tier?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Disable Pro",
                        style: "destructive",
                        onPress: revertAction
                    }
                ]
            );
        }
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
                    className="bg-amber-500 rounded-2xl p-5 mb-4 shadow-lg shadow-amber-500/30 active:scale-[0.98]"
                >
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1 mr-4">
                            <Text className="text-white font-black text-xl mb-1">Upgrade to Premium</Text>
                            <Text className="text-white/80 text-xs font-semibold">Unlock Spend Review Pro, PDF Reports, and Cloud Sync.</Text>
                        </View>
                        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                            <Ionicons name="sparkles" size={24} color="white" />
                        </View>
                    </View>
                </Pressable>
            ) : (
                <Pressable
                    onLongPress={handleDebugRevert}
                    delayLongPress={2000}
                    className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-4 mb-4 flex-row items-center active:opacity-80"
                >
                    <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-200 dark:border-amber-900/20">
                        <Ionicons name="star" size={20} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Premium Activated</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">Thanks for being a Pro member!</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </Pressable>
            )}

            {/* Payment Processing Modal */}
            <Modal
                transparent
                visible={isProcessing}
                animationType="fade"
            >
                <View className="flex-1 bg-black/60 items-center justify-center">
                    <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl items-center w-[200px]">
                        <ActivityIndicator size="large" color="#f59e0b" className="mb-4" />
                        <Text className="font-bold text-gray-800 dark:text-white">Processing...</Text>
                    </View>
                </View>
            </Modal>

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
                        {isPremium ? (
                            <Text className="text-[10px] font-bold text-green-600 dark:text-green-400 mr-1">
                                Enabled
                            </Text>
                        ) : (
                            <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                                <Ionicons name="lock-closed" size={8} color="#d97706" />
                                <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">PRO</Text>
                            </View>
                        )}
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
                <View className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10">
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

                {/* Data Export (CSV) */}
                <Pressable
                    onPress={handleExportData}
                    disabled={!isPremium}
                    className={`flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 ${!isPremium ? 'opacity-60' : 'active:bg-gray-50 dark:active:bg-gray-800'}`}
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="document-text-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Export Data (CSV)</Text>
                            <Text className="text-[10px] text-gray-400">Download your financial reports</Text>
                        </View>
                    </View>
                    {isPremium ? (
                        <Ionicons name="download-outline" size={16} color="#2563eb" />
                    ) : (
                        <View className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                            <Ionicons name="lock-closed" size={8} color="#d97706" />
                            <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">PRO</Text>
                        </View>
                    )}
                </Pressable>

                {/* Receipt Scanning (Soon) */}
                <View className="flex-row items-center justify-between p-3 opacity-60">
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3 border border-amber-100 dark:border-amber-900/20">
                            <Ionicons name="camera-outline" size={14} color="#f59e0b" />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">Receipt Scanning</Text>
                            <Text className="text-[10px] text-gray-400">Auto-extract details from photos</Text>
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
