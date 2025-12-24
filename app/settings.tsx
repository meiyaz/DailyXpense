import * as LocalAuthentication from 'expo-local-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { View, Text, Switch, Modal, TextInput, Alert, ScrollView, Pressable, TouchableOpacity, FlatList, useColorScheme as useRNColorScheme } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../store/SettingsContext";
import { useState, useRef, useEffect } from "react";
import { useExpenses } from "../store/ExpenseContext";
import { useAuth } from "../store/AuthContext";

import ExportModal from "../components/ExportModal";
import { SafeTimePicker } from "../components/SafeTimePicker";
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';

const AVAILABLE_ICONS = [
    "cart", "car", "fast-food", "game-controller",
    "home", "receipt", "medkit", "airplane",
    "bicycle", "book", "briefcase", "cafe",
    "camera", "card", "construct", "film",
    "fitness", "flower", "gift", "globe",
    "hammer", "heart", "key", "library",
    "map", "musical-notes", "paw", "phone-portrait",
    "restaurant", "school", "shirt", "ticket",
    "trophy", "wallet", "watch", "wine",
    "person", "person-circle", "happy", "glasses", "woman", "man"
];

const PROFILE_ICONS = [
    "person", "person-circle", "person-add", "people", "briefcase",
    "school", "business", "laptop", "easel", "library", "glasses", "shirt"
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Settings() {
    const router = useRouter();
    const {
        currency, budget, theme,
        notificationsEnabled, reminderTime,
        appLockEnabled, securityPin,
        avatar, name,
        categories,
        updateSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        lastSyncTime,
        maxAmount
    } = useSettings();
    const { expenses } = useExpenses();
    const { signOut, user } = useAuth();
    const systemScheme = useRNColorScheme();
    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

    const [newName, setNewName] = useState(name);
    const [isEditingName, setIsEditingName] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);

    // Category Creator/Editor State
    const [showCategoryCreator, setShowCategoryCreator] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null); // Store category being edited
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("pricetag");
    const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [tempBudget, setTempBudget] = useState("");

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tempPickerDate, setTempPickerDate] = useState(new Date());

    const [showMaxAmountModal, setShowMaxAmountModal] = useState(false);
    const [tempMaxAmount, setTempMaxAmount] = useState("");

    const getDateFromTimeStr = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 0, minutes || 0, 0, 0);
        return date;
    };



    const [showPinModal, setShowPinModal] = useState(false);
    const [tempPin, setTempPin] = useState("");
    const [isSettingNewPin, setIsSettingNewPin] = useState(false);


    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        // Simulate sync delay
        setTimeout(() => {
            setIsSyncing(false);
            Alert.alert("Sync Complete", "Your data has been successfully synced to the cloud.");
        }, 2000);
    };

    useEffect(() => {
        // We allow the module to load now, even in Expo Go Android, 
        // because we want Local Notifications (reminders) to work.
        // Web: We also want to attempt to load it.
        try {
            const Notifications = require('expo-notifications');
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldShowFastResponse: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                }),
            });

            registerForPushNotificationsAsync();
        } catch (e) { /* Notification setup failed */ }
    }, []);

    useEffect(() => {
        if (notificationsEnabled) {
            schedulePushNotification(reminderTime);
        } else {
            safeCancelNotifications();
        }
    }, [notificationsEnabled, reminderTime]);

    async function safeCancelNotifications() {
        if (Platform.OS === 'web') return; // Not supported on Web via Expo without SW
        try {
            const Notifications = require('expo-notifications');
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) {
        }
    }

    async function schedulePushNotification(timeStr: string) {
        await safeCancelNotifications();

        const [hours, minutes] = timeStr.split(':').map(Number);

        // Web Fallback: Use standard Browser Notification API if available
        if (Platform.OS === 'web') {
            if ("Notification" in window && Notification.permission === "granted") {
                // We can't easily "schedule" a daily background job on simple web without Service Worker.
                // Best we can do is show a "Reminder Set" toast or just log it.
                // For now, we avoid the crash.
                // Web Reminder scheduled (simulated)
            }
            return;
        }

        try {
            const Notifications = require('expo-notifications');
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "DailyXpense Reminder 📝",
                    body: "Don't forget to log your expenses for today!",
                    sound: 'default',
                },
                trigger: {
                    hour: hours,
                    minute: minutes,
                    type: Notifications.SchedulableTriggerInputTypes.DAILY
                },
            });
        } catch (e) { /* silent fail */ }
    }

    async function registerForPushNotificationsAsync() {
        // Web: Use standard browser permission request
        if (Platform.OS === 'web') {
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    // Web Notification permission denied
                    return;
                }
            }
            return;
        }

        try {
            const Notifications = require('expo-notifications');
            const Device = require('expo-device');
            const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            // On Web, Device.isDevice might be false or true depending on context, 
            // but we want to try requesting permissions anyway if the browser supports it.
            if (Device.isDevice || (Platform.OS as string) === 'web') {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    // Notification permission not granted
                    return;
                }

                // CRITICAL FIX: Do NOT try to get push token in Expo Go on Android
                // This is what causes the crash. We stop here.
                if (Platform.OS === 'android' && isExpoGo) {
                    // Skipping Push Token generation in Expo Go Android
                    return;
                }

                // For Web, we stop here (Local Notifications only) unless we configure VAPID.
                if ((Platform.OS as string) === 'web') return;

                // If we were in a real build, we would get the token here:
                // const token = await Notifications.getExpoPushTokenAsync(...);
            }
        } catch (e) { /* Notification registration failed */ }
    }



    const openCategoryCreator = () => {
        setEditingCategory(null);
        setNewCategoryName("");
        setNewCategoryIcon("pricetag");
        setNewCategoryType("expense"); // Default for new
        setShowCategoryCreator(true);
    };

    const openCategoryEditor = (cat: any) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
        setNewCategoryIcon(cat.icon);
        setNewCategoryType(cat.type || 'expense');
        setShowCategoryCreator(true);
    };

    const handleSaveCategory = () => {
        if (!newCategoryName.trim()) return;

        if (editingCategory) {
            // Update existing
            // Keep original color for now, or randomize if we wanted to change it (but better to keep consistency)
            updateCategory(editingCategory.id, newCategoryName.trim(), editingCategory.color, newCategoryIcon, newCategoryType);
        } else {
            // Create new - Default to 'expense' for now, or add UI later
            const colors = ["#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#6366F1", "#EC4899", "#3B82F6", "#14B8A6"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            addCategory(newCategoryName.trim(), randomColor, newCategoryIcon, newCategoryType);
        }

        setShowCategoryCreator(false);
        setNewCategoryName("");
        setNewCategoryIcon("pricetag");
        setEditingCategory(null);
    };

    const handleDeleteFromModal = () => {
        if (!editingCategory) return;

        Alert.alert(
            "Delete Category",
            `Are you sure you want to delete "${editingCategory.name}" ? `,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteCategory(editingCategory.id);
                        setShowCategoryCreator(false);
                    }
                }
            ]
        );
    };

    const CURRENCIES = [
        { symbol: "₹", name: "INR" },
        { symbol: "$", name: "USD" },
        { symbol: "€", name: "EUR" },
        { symbol: "£", name: "GBP" },
        { symbol: "¥", name: "JPY" }
    ];

    const handleSaveName = () => {
        updateSettings({ name: newName });
        setIsEditingName(false);
    };






    // Helper to determine if avatar is an icon or emoji
    const isIcon = (str: string) => AVAILABLE_ICONS.includes(str) || PROFILE_ICONS.includes(str) || str.includes("-") || str === "pricetag";

    const handleToggleNotifications = async (value: boolean) => {
        if (Platform.OS === 'web') {
            if (value) Alert.alert("Coming Soon", "Web notifications are currently under development.");
            updateSettings({ notificationsEnabled: false });
            return;
        }

        if (value) {
            // User wants to enable
            try {
                const Notifications = require('expo-notifications');
                const { status } = await Notifications.getPermissionsAsync();
                let finalStatus = status;

                if (status !== 'granted') {
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    finalStatus = newStatus;
                }

                if (finalStatus === 'granted') {
                    // Permission granted, enable notifications
                    // Ensure time is set to default 8:00 PM if missing
                    if (!reminderTime) {
                        updateSettings({ notificationsEnabled: true, reminderTime: "20:00" });
                    } else {
                        updateSettings({ notificationsEnabled: true });
                    }
                } else {
                    // Permission denied, force disable
                    Alert.alert("Permission Required", "Please enable notifications in your device settings to receive reminders.");
                    updateSettings({ notificationsEnabled: false });
                }
            } catch (e) {
                // Error checking permissions
                updateSettings({ notificationsEnabled: false });
            }
        } else {
            // User wants to disable
            updateSettings({ notificationsEnabled: false });
        }
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-black">
            <Stack.Screen options={{
                title: "Settings",
                headerBackTitle: "Home",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: isDark ? '#000000' : '#f9fafb' },
                headerTintColor: isDark ? 'white' : 'black',
                headerLeft: Platform.OS === 'web' ? () => (
                    <Pressable
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/');
                            }
                        }}
                        className="active:opacity-50 pl-2"
                    >
                        <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                    </Pressable>
                ) : undefined
            }} />



            <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
                <View className="p-5">
                    {/* 1. Profile Section (Centered) */}
                    <View className="items-center mb-8 mt-2">
                        <TouchableOpacity
                            onPress={() => setShowAvatarPicker(true)}
                            className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-3 border-2 border-blue-100 dark:border-blue-900/30 relative"
                        >
                            {isIcon(avatar) || PROFILE_ICONS.includes(avatar) ? (
                                <Ionicons name={avatar as any} size={40} color="#2563eb" />
                            ) : (
                                <Text className="text-4xl">{avatar || "👤"}</Text>
                            )}

                            <View className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-white dark:border-black">
                                <Ionicons name="pencil" size={10} color="white" />
                            </View>
                        </TouchableOpacity>

                        {isEditingName ? (
                            <View className="flex-row items-center">
                                <TextInput
                                    className="border-b border-primary py-0 text-xl font-bold text-gray-900 dark:text-white min-w-[120px] text-center"
                                    value={newName}
                                    onChangeText={setNewName}
                                    autoFocus
                                    onSubmitEditing={handleSaveName}
                                />
                                <Pressable onPress={handleSaveName} className="ml-2 absolute -right-8">
                                    <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable onPress={() => setIsEditingName(true)} className="flex-row items-center">
                                <Text className="text-xl font-bold text-gray-900 dark:text-white mr-2">{name || "Your Name"}</Text>
                                <Ionicons name="pencil-outline" size={16} color="#9ca3af" />
                            </Pressable>
                        )}
                        {user?.email && (
                            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</Text>
                        )}
                    </View>

                    {/* Categories: Minimalist Tag Cloud */}
                    <View className="mb-6">
                        <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Categories</Text>

                        <View className="flex-row flex-wrap gap-2">
                            {categories.map((cat) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => openCategoryEditor(cat)}
                                    className="flex-row items-center bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-1.5 active:bg-gray-100 dark:active:bg-gray-800"
                                >
                                    <Ionicons name={cat.icon as any || "pricetag"} size={12} color={cat.color} style={{ marginRight: 6 }} />
                                    <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.name}</Text>
                                </Pressable>
                            ))}

                            <Pressable
                                onPress={openCategoryCreator}
                                className="flex-row items-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 active:bg-gray-50 dark:active:bg-gray-800"
                            >
                                <Ionicons name="add" size={12} color="#9ca3af" />
                                <Text className="text-[10px] font-bold text-gray-400 ml-1">New</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* STEP 2: Display Interactive Sections (Preferences & Security) */}
                    <View className="mb-6">
                        <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">App Settings</Text>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                            {/* Currency */}
                            <Pressable
                                onPress={() => setShowCurrencyPicker(true)}
                                className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                                        <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{currency}</Text>
                                    </View>
                                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-xs text-gray-400 mr-1">{CURRENCIES.find(c => c.symbol === currency)?.name}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                                </View>
                            </Pressable>

                            {/* Monthly Budget (Coming Soon) */}
                            <View
                                className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 opacity-60"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="wallet-outline" size={14} color="#F59E0B" />
                                    </View>
                                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Budget</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-xs text-gray-400 mr-1">Coming Soon</Text>
                                </View>
                            </View>

                            {/* Theme - Options Selector */}
                            <Pressable
                                onPress={() => setShowThemePicker(true)}
                                className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
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
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
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
                                onPress={() => {
                                    setIsSyncing(true);
                                    setTimeout(() => {
                                        setIsSyncing(false);
                                        updateSettings({ lastSyncTime: Date.now() });
                                        Alert.alert("Sync Complete", "Your data has been successfully synced to the cloud.");
                                    }, 2000);
                                }}
                                disabled={isSyncing}
                                className="flex-row items-center justify-between p-3 active:bg-gray-100 dark:active:bg-gray-800"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="cloud-upload-outline" size={14} color="#2563eb" />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Sync Cloud</Text>
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

                    {/* Security & Notifications Group */}
                    <View className="mb-6">
                        <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Security & Notifications</Text>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                            {/* Daily Reminders */}
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        Alert.alert("Coming Soon", "Web notifications are currently under development.");
                                        return;
                                    }
                                    setTempPickerDate(getDateFromTimeStr(reminderTime));
                                    setShowTimePicker(true);
                                }}
                                className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-800 relative"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
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
                                onPress={async () => {
                                    if ((Platform.OS as string) === 'web') {
                                        if (appLockEnabled) {
                                            updateSettings({ appLockEnabled: false, securityPin: null });
                                        } else {
                                            setIsSettingNewPin(true);
                                            setTempPin("");
                                            setShowPinModal(true);
                                        }
                                    } else {
                                        if (!appLockEnabled) {
                                            const result = await LocalAuthentication.authenticateAsync({
                                                promptMessage: 'Authenticate to enable App Lock',
                                            });
                                            if (result.success) {
                                                updateSettings({ appLockEnabled: true });
                                            }
                                        } else {
                                            updateSettings({ appLockEnabled: false });
                                        }
                                    }
                                }}
                                className="flex-row items-center justify-between p-3 active:bg-gray-100 dark:active:bg-gray-800"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full items-center justify-center mr-3">
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
                                    onValueChange={async (val) => {
                                        if ((Platform.OS as string) === 'web') {
                                            if (val) {
                                                if (!securityPin) {
                                                    setIsSettingNewPin(true);
                                                    setTempPin("");
                                                    setShowPinModal(true);
                                                } else {
                                                    updateSettings({ appLockEnabled: true });
                                                }
                                            } else {
                                                updateSettings({ appLockEnabled: false, securityPin: null });
                                            }
                                        } else {
                                            if (val) {
                                                const result = await LocalAuthentication.authenticateAsync({
                                                    promptMessage: 'Authenticate to enable App Lock',
                                                });
                                                if (result.success) {
                                                    updateSettings({ appLockEnabled: true });
                                                }
                                            } else {
                                                updateSettings({ appLockEnabled: false });
                                            }
                                        }
                                    }}
                                    trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                                    thumbColor={"white"}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* STEP 3: Premium & Data Management (Save & Sync features) */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Premium Features</Text>
                            <View className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                <Text className="text-[8px] font-bold text-amber-600 dark:text-amber-400">PRO</Text>
                            </View>
                        </View>
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-amber-100 dark:border-amber-900/20">
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
                            <View
                                className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 opacity-60"
                            >
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
                            <View
                                className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 opacity-60"
                            >
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
                            <View
                                className="flex-row items-center justify-between p-3 border-b border-amber-50 dark:border-amber-900/10 opacity-60"
                            >
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
                            <View
                                className="flex-row items-center justify-between p-3 opacity-60"
                            >
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

                    {/* Log Out Button */}
                    <Pressable
                        onPress={signOut}
                        className="flex-row items-center justify-center p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl active:bg-red-100 dark:active:bg-red-900/20 mb-6"
                    >
                        <Ionicons name="log-out-outline" size={14} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text className="text-red-600 dark:text-red-400 font-bold text-xs">Log Out from Account</Text>
                    </Pressable>

                    <Text className="text-center text-xs text-gray-400 pb-10 mt-auto">Developed with ❤️ by Mei</Text>

                </View>
            </ScrollView>

            {/* Modals Logic - Moved outside ScrollView for better Web compatibility */}
            < Modal
                animationType="fade"
                transparent={true}
                visible={showAvatarPicker}
                onRequestClose={() => setShowAvatarPicker(false)
                }
            >
                <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={() => setShowAvatarPicker(false)}>
                    <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-[80%] shadow-2xl">
                        <Text className="text-lg font-bold text-center mb-4 text-gray-800 dark:text-white">Choose Avatar</Text>
                        <View className="flex-1 max-h-[400px]">
                            <FlatList
                                data={PROFILE_ICONS}
                                keyExtractor={(item) => item}
                                numColumns={5}
                                showsVerticalScrollIndicator={false}
                                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 15 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            updateSettings({ avatar: item });
                                            setShowAvatarPicker(false);
                                        }}
                                        className={`w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl items-center justify-center ${avatar === item ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500' : ''} `}
                                    >
                                        <Ionicons name={item as any} size={24} color={avatar === item ? "#2563eb" : "#9ca3af"} />
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                        <Pressable
                            onPress={() => setShowAvatarPicker(false)}
                            className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl items-center"
                        >
                            <Text className="font-bold text-gray-600 dark:text-gray-400">Cancel</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal >

            <Modal
                animationType="slide"
                transparent={true}
                visible={showCurrencyPicker}
                onRequestClose={() => setShowCurrencyPicker(false)}
            >
                <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowCurrencyPicker(false)}>
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-10">
                        <Text className="text-lg font-bold text-center mb-6 text-gray-800 dark:text-white">Select Currency</Text>
                        <View className="flex-row flex-wrap gap-3 justify-center">
                            {CURRENCIES.map((curr) => (
                                <Pressable
                                    key={curr.symbol}
                                    onPress={() => {
                                        updateSettings({ currency: curr.symbol });
                                        setShowCurrencyPicker(false);
                                    }}
                                    className={`w-[45%] flex-row items-center p-4 rounded-xl border ${currency === curr.symbol ? "bg-blue-50 dark:bg-blue-900/20 border-primary" : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                        } `}
                                >
                                    <Text className="text-2xl mr-3 font-bold text-gray-900 dark:text-white">{curr.symbol}</Text>
                                    <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400">{curr.name}</Text>
                                    {currency === curr.symbol && (
                                        <View className="ml-auto">
                                            <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                                        </View>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Category Creator/Editor Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showCategoryCreator}
                onRequestClose={() => setShowCategoryCreator(false)}
            >
                <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowCategoryCreator(false)}>
                    <Pressable className="bg-white dark:bg-gray-900 rounded-t-3xl h-[70%] shadow-2xl p-5" onPress={(e) => e.stopPropagation()}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-800 dark:text-white">{editingCategory ? "Edit Category" : "New Category"}</Text>
                            <Pressable onPress={() => setShowCategoryCreator(false)} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <Ionicons name="close" size={20} color="#6b7280" />
                            </Pressable>
                        </View>

                        <View className="flex-1">
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Name</Text>
                            <TextInput
                                className="text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6"
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="e.g. Subscriptions"
                                placeholderTextColor="#9ca3af"
                                autoFocus
                            />

                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Type</Text>
                            <View className="flex-row gap-3 mb-6">
                                <Pressable
                                    onPress={() => setNewCategoryType('expense')}
                                    className={`flex-1 py-3 items-center rounded-xl border ${newCategoryType === 'expense' ? 'bg-red-50 border-red-500' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}
                                >
                                    <Text className={`font-bold ${newCategoryType === 'expense' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>Expense</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setNewCategoryType('income')}
                                    className={`flex-1 py-3 items-center rounded-xl border ${newCategoryType === 'income' ? 'bg-green-50 border-green-500' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}
                                >
                                    <Text className={`font-bold ${newCategoryType === 'income' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>Income</Text>
                                </Pressable>
                            </View>

                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Icon</Text>
                            <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 mb-6">
                                <FlatList
                                    data={AVAILABLE_ICONS}
                                    keyExtractor={(item) => item}
                                    numColumns={6}
                                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            onPress={() => setNewCategoryIcon(item)}
                                            className={`w-10 h-10 items-center justify-center rounded-xl ${newCategoryIcon === item ? 'bg-blue-600' : 'bg-transparent'} `}
                                        >
                                            <Ionicons name={item as any} size={20} color={newCategoryIcon === item ? 'white' : '#6b7280'} />
                                        </Pressable>
                                    )}
                                />
                            </View>

                            <View className="gap-3">
                                <Pressable
                                    onPress={handleSaveCategory}
                                    className={`p-4 rounded-xl items-center ${newCategoryName.trim() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'} `}
                                    disabled={!newCategoryName.trim()}
                                >
                                    <Text className={`font-bold ${newCategoryName.trim() ? 'text-white' : 'text-gray-500 dark:text-gray-400'} `}>{editingCategory ? "Update Category" : "Create Category"}</Text>
                                </Pressable>

                                {editingCategory && (
                                    <Pressable
                                        onPress={handleDeleteFromModal}
                                        className="p-4 rounded-xl items-center bg-red-50 dark:bg-red-900/20"
                                    >
                                        <Text className="font-bold text-red-600 dark:text-red-400">Delete Category</Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <ExportModal
                visible={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            <Modal
                animationType="fade"
                transparent={true}
                visible={showBudgetModal}
                onRequestClose={() => setShowBudgetModal(false)}
            >
                <Pressable className="flex-1 bg-black/60 justify-center items-center p-4" onPress={() => setShowBudgetModal(false)}>
                    <Pressable className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
                        <Text className="text-lg font-bold text-center mb-2 text-gray-800 dark:text-white">Monthly Budget</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">Set your spending goal.</Text>

                        <View className="items-center justify-center mb-8">
                            <View className="flex-row items-baseline">
                                <Text className="text-3xl font-bold text-gray-400 mr-2">{currency}</Text>
                                <TextInput
                                    className="text-5xl font-bold text-gray-900 dark:text-white text-center min-w-[100px]"
                                    value={tempBudget}
                                    onChangeText={(t) => setTempBudget(t.replace(/[^0-9]/g, ''))}
                                    placeholder="0"
                                    placeholderTextColor="#d1d5db"
                                    keyboardType="number-pad"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <View className="flex-row flex-wrap justify-center gap-3 mb-8">
                            {[1000, 5000, 10000, 25000].map((amount) => (
                                <Pressable
                                    key={amount}
                                    onPress={() => {
                                        const current = parseInt(tempBudget || '0', 10);
                                        setTempBudget((current + amount).toString());
                                    }}
                                    className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full border border-blue-100 dark:border-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/40"
                                >
                                    <Text className="text-primary dark:text-blue-400 font-semibold text-xs">+ {currency}{amount.toLocaleString()}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setShowBudgetModal(false)}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl items-center active:bg-gray-200 dark:active:bg-gray-700"
                            >
                                <Text className="font-bold text-gray-600 dark:text-gray-300">Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    const val = parseFloat(tempBudget);
                                    updateSettings({ budget: isNaN(val) ? 0 : val });
                                    setShowBudgetModal(false);
                                }}
                                className="flex-1 bg-primary p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none"
                            >
                                <Text className="font-bold text-white">Save Budget</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showThemePicker}
                onRequestClose={() => setShowThemePicker(false)}
            >
                <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowThemePicker(false)}>
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-10">
                        <Text className="text-lg font-bold text-center mb-6 text-gray-800 dark:text-white">Choose Theme</Text>
                        <View className="gap-3">
                            {[
                                { id: 'system', label: 'System', icon: 'phone-portrait' },
                                { id: 'light', label: 'Light', icon: 'sunny' },
                                { id: 'dark', label: 'Dark', icon: 'moon' },
                            ].map((t) => (
                                <Pressable
                                    key={t.id}
                                    onPress={() => {
                                        updateSettings({ theme: t.id as any });
                                        setShowThemePicker(false);
                                    }}
                                    className={`flex-row items-center p-4 rounded-xl border ${theme === t.id ? "bg-blue-50 dark:bg-blue-900/20 border-primary" : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                        }`}
                                >
                                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${theme === t.id ? "bg-white dark:bg-blue-800" : "bg-white dark:bg-gray-700"
                                        }`}>
                                        <Ionicons name={t.icon as any} size={18} color={theme === t.id ? "#2563eb" : "#6b7280"} />
                                    </View>
                                    <Text className={`text-base font-semibold ${theme === t.id ? "text-primary dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                                        }`}>{t.label}</Text>
                                    {theme === t.id && (
                                        <View className="ml-auto">
                                            <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                                        </View>
                                    )}
                                </Pressable>
                            ))}

                            <View className="mt-4 pt-4 border-t border-gray-100 opacity-50">
                                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Accent Colors (Coming Soon)</Text>
                                <View className="flex-row items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <View className="flex-row items-center">
                                        <Ionicons name="color-palette" size={20} color="#9ca3af" />
                                        <Text className="ml-3 font-semibold text-gray-400">Custom Colors</Text>
                                    </View>
                                    <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                                </View>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showPinModal}
                onRequestClose={() => setShowPinModal(false)}
            >
                <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={() => setShowPinModal(false)}>
                    <Pressable className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-[80%] shadow-2xl" onPress={(e) => e.stopPropagation()}>
                        <Text className="text-lg font-bold text-center mb-2 text-gray-800 dark:text-white">{securityPin ? "Change PIN" : "Set New PIN"}</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Enter a 4-digit PIN to secure your data.</Text>

                        <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 mb-6 justify-center">
                            <TextInput
                                className="text-3xl font-bold text-gray-900 dark:text-white text-center w-full tracking-widest"
                                value={tempPin}
                                onChangeText={setTempPin}
                                placeholder="••••"
                                placeholderTextColor="#9ca3af"
                                maxLength={4}
                                keyboardType="numeric"
                                secureTextEntry
                                autoFocus
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setShowPinModal(false)}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl items-center"
                            >
                                <Text className="font-bold text-gray-600 dark:text-gray-300">Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    if (tempPin.length === 4) {
                                        updateSettings({ securityPin: tempPin, appLockEnabled: true });
                                        setShowPinModal(false);
                                        Alert.alert("Success", "App Lock is now enabled with your new PIN.");
                                    } else {
                                        Alert.alert("Invalid PIN", "Please enter a 4-digit PIN.");
                                    }
                                }}
                                className="flex-1 bg-primary p-3 rounded-xl items-center"
                            >
                                <Text className="font-bold text-white">Set PIN</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showMaxAmountModal}
                onRequestClose={() => setShowMaxAmountModal(false)}
            >
                <Pressable className="flex-1 bg-black/60 justify-center items-center p-4" onPress={() => setShowMaxAmountModal(false)}>
                    <Pressable className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl" onPress={(e) => e.stopPropagation()}>
                        <Text className="text-lg font-bold text-center mb-2 text-gray-800 dark:text-white">Transaction Limit</Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">Set the maximum allowed amount for a single entry.</Text>

                        <View className="items-center justify-center mb-8">
                            <View className="flex-row items-baseline">
                                <Text className="text-3xl font-bold text-gray-400 mr-2">{currency}</Text>
                                <Text className="text-5xl font-bold text-gray-900 dark:text-white text-center">
                                    {parseInt(tempMaxAmount || '0').toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        {/* Quick Selection Grid */}
                        <View className="flex-row flex-wrap justify-center gap-3 mb-8">
                            {[1000, 10000, 50000, 100000, 500000, 1000000].map((limit) => (
                                <Pressable
                                    key={limit}
                                    onPress={() => setTempMaxAmount(limit.toString())}
                                    className={`w-[29%] aspect-square rounded-2xl border-2 items-center justify-center ${tempMaxAmount === limit.toString() ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'} active:scale-95 transition-transform`}
                                >
                                    <View className={`w-8 h-8 rounded-full mb-1 items-center justify-center ${tempMaxAmount === limit.toString() ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                        <Text className={`text-[10px] font-bold ${tempMaxAmount === limit.toString() ? 'text-white' : 'text-gray-400'}`}>
                                            {limit >= 100000 ? (limit / 100000) + 'L' : (limit / 1000) + 'k'}
                                        </Text>
                                    </View>
                                    <Text className={`font-bold text-[10px] ${tempMaxAmount === limit.toString() ? 'text-white' : 'text-gray-500'}`}>{currency}{limit.toLocaleString()}</Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Interactive Scale Indicator */}
                        <View className="mb-8 px-2">
                            <Text className="text-[10px] font-bold text-gray-400 mb-3 uppercase text-center tracking-widest">Selected Scale</Text>
                            <View className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                <View
                                    style={{
                                        width: `${Math.min((parseInt(tempMaxAmount || '0') / 1000000) * 100, 100)}%`,
                                        backgroundColor: '#3b82f6',
                                        height: '100%'
                                    }}
                                />
                            </View>
                            <View className="flex-row justify-between mt-2">
                                <View>
                                    <Text className="text-[8px] font-bold text-gray-400 uppercase">Minimum</Text>
                                    <Text className="text-[10px] font-bold text-gray-600 dark:text-gray-300">₹100</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[8px] font-bold text-gray-400 uppercase">Maximum</Text>
                                    <Text className="text-[10px] font-bold text-gray-600 dark:text-gray-300">10 Lakhs+</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={() => setShowMaxAmountModal(false)}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl items-center"
                            >
                                <Text className="font-bold text-gray-600 dark:text-gray-300">Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    const val = parseInt(tempMaxAmount || '0', 10);
                                    if (val < 100) {
                                        Alert.alert("Limit Too Low", "Minimum limit must be at least 100.");
                                        return;
                                    }
                                    updateSettings({ maxAmount: val });
                                    setShowMaxAmountModal(false);
                                }}
                                className="flex-1 bg-primary p-4 rounded-xl items-center"
                            >
                                <Text className="font-bold text-white">Save Limit</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <SafeTimePicker
                visible={showTimePicker}
                date={tempPickerDate}
                theme={isDark ? 'dark' : 'light'}
                onClose={() => setShowTimePicker(false)}
                onChange={(event: any, date?: Date) => {
                    if (Platform.OS === 'android') {
                        setShowTimePicker(false);
                        if (event.type === 'set' && date) {
                            const h = date.getHours().toString().padStart(2, '0');
                            const m = date.getMinutes().toString().padStart(2, '0');
                            updateSettings({ reminderTime: `${h}:${m}` });
                        }
                    } else {
                        // iOS: just update temp state
                        if (date) setTempPickerDate(date);
                    }
                }}
                onSaveIos={(date: Date) => {
                    const h = date.getHours().toString().padStart(2, '0');
                    const m = date.getMinutes().toString().padStart(2, '0');
                    updateSettings({ reminderTime: `${h}:${m}` });
                    setShowTimePicker(false);
                }}
            />
        </View >
    );
}
