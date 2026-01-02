import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../store/AuthContext";
import Constants from 'expo-constants';
import { CustomAlert } from "../ui/CustomAlert";

export const AccountSection: React.FC = () => {
    const { signOut, user } = useAuth();

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        icon: undefined as any,
        buttons: [] as any[]
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
    const showCustomAlert = (title: string, message: string, icon: any, buttons: any[] = [{ text: "OK" }]) => {
        setAlertConfig({ visible: true, title, message, icon, buttons });
    };

    return (
        <View className="mb-8">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Account & Data</Text>
            <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Sign Out */}
                <Pressable
                    onPress={() => {
                        showCustomAlert(
                            "Log Out",
                            "Are you sure you want to log out?",
                            "log-out",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Log Out", style: "destructive", onPress: () => signOut() }
                            ]
                        );
                    }}
                    className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center mr-3">
                            <Ionicons name="log-out-outline" size={14} color="#EF4444" />
                        </View>
                        <Text className="text-sm font-medium text-red-600 dark:text-red-400">Log Out</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </Pressable>

                {/* Reset Data */}
                <View
                    className="flex-row items-center justify-between p-3 opacity-40"
                >
                    <View className="flex-row items-center">
                        <View className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                            <Ionicons name="trash-outline" size={14} color="#9ca3af" />
                        </View>
                        <Text className="text-sm font-medium text-gray-400">Delete All Data</Text>
                    </View>
                    <View className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        <Text className="text-[8px] font-bold text-gray-500 uppercase">SOON</Text>
                    </View>
                </View>
            </View>

            {/* App Info */}
            <View className="items-center mt-6">
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 italic">Premium Edition</Text>
                <Text className="text-[10px] text-gray-300 dark:text-gray-600">DailyXpense v2.1.0 (PRO)</Text>
                <Text className="text-[9px] text-gray-300 dark:text-gray-700 mt-0.5">Build: {Constants.expoConfig?.version || 'Stable'}</Text>
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                buttons={alertConfig.buttons}
                onClose={closeAlert}
            />
        </View>
    );
};
