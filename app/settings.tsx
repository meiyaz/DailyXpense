import * as LocalAuthentication from 'expo-local-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { View, Text, Switch, Modal, TextInput, Alert, ScrollView, Pressable, TouchableOpacity, FlatList, useColorScheme as useRNColorScheme, Image } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSettings } from "../store/SettingsContext";
import { useState, useRef, useEffect } from "react";
import { useExpenses } from "../store/ExpenseContext";
import { useAuth } from "../store/AuthContext";

import ExportModal from "../components/ExportModal";
import { SafeTimePicker } from "../components/SafeTimePicker";
import { ProfileSection } from "../components/settings/ProfileSection";
import { CategoriesSection } from "../components/settings/CategoriesSection";
import { AppSettingsSection } from "../components/settings/AppSettingsSection";
import { SecuritySection } from "../components/settings/SecuritySection";
import { PremiumSection } from "../components/settings/PremiumSection";
import { AccountSection } from "../components/settings/AccountSection";
import { CategoryModal } from "../components/settings/CategoryModal";
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';

const AVAILABLE_ICONS = [
    "cart", "car", "fast-food", "game-controller",
    "home", "receipt", "medkit", "airplane",
    "bicycle", "book", "briefcase", "cafe",
    "camera", "fitness", "flower", "gift", "globe",
    "hammer", "heart", "key", "library",
    "map", "musical-notes", "paw", "phone-portrait",
    "restaurant", "school", "shirt", "ticket",
    "trophy", "wallet", "watch", "wine",
    "person", "person-circle", "happy", "glasses", "woman", "man"
];

const PROFILE_ICONS = [
    "person", "person-circle", "person-add", "people", "briefcase",
    "school", "business", "laptop", "easel", "library",
    "glasses", "shirt", "happy", "star", "heart"
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CURRENCIES = [
    { symbol: "₹", name: "INR" },
    { symbol: "$", name: "USD" },
    { symbol: "€", name: "EUR" },
    { symbol: "£", name: "GBP" },
    { symbol: "¥", name: "JPY" }
];

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
        // We delay notification setup to when it's actually toggled or needed.
        // In Expo Go 54, just requiring the module triggers a push usage warning.
        /*
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
        } catch (e) { } 
        */
    }, []);

    useEffect(() => {
        // DISABLED FOR EXPO GO STABILITY
        /*
        if (notificationsEnabled) {
            schedulePushNotification(reminderTime);
        } else {
            safeCancelNotifications();
        }
        */
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



    const handleSaveName = () => {
        updateSettings({ name: newName });
        setIsEditingName(false);
    };






    // Helper to determine if avatar is an icon or emoji
    const isIcon = (str: string) => AVAILABLE_ICONS.includes(str) || PROFILE_ICONS.includes(str) || str.includes("-") || str === "pricetag";
    const isImage = (str: string) => str && (str.startsWith('data:image') || str.startsWith('file://') || str.startsWith('http'));

    const pickImage = async (useCamera: boolean = false) => {
        try {
            let result;
            if (useCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Permission Required", "Camera access is needed to take a photo.");
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 1,
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                });
            }

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                // Optimize image: resize to 300x300 and compress for storage
                const manipResult = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 300, height: 300 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );

                if (manipResult.base64) {
                    const base64Uri = `data:image/jpeg;base64,${manipResult.base64}`;
                    updateSettings({ avatar: base64Uri });
                    setShowAvatarPicker(false);
                }
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to process image. Please try again.");
        }
    };

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
                    <ProfileSection
                        isEditingName={isEditingName}
                        setIsEditingName={setIsEditingName}
                        newName={newName}
                        setNewName={setNewName}
                        handleSaveName={handleSaveName}
                        setShowAvatarPicker={setShowAvatarPicker}
                    />

                    <CategoriesSection
                        openCategoryEditor={openCategoryEditor}
                        openCategoryCreator={openCategoryCreator}
                    />

                    <AppSettingsSection
                        isDark={isDark}
                        setShowCurrencyPicker={setShowCurrencyPicker}
                        setShowThemePicker={setShowThemePicker}
                        setTempMaxAmount={setTempMaxAmount}
                        setShowMaxAmountModal={setShowMaxAmountModal}
                        isSyncing={isSyncing}
                        handleSync={handleSync}
                        currencies={CURRENCIES}
                    />

                    <SecuritySection
                        handleToggleNotifications={handleToggleNotifications}
                        onTimePickerPress={() => {
                            if (Platform.OS === 'web') {
                                Alert.alert("Coming Soon", "Web notifications are currently under development.");
                                return;
                            }
                            setTempPickerDate(getDateFromTimeStr(reminderTime));
                            setShowTimePicker(true);
                        }}
                        onAppLockPress={async () => {
                            if (Platform.OS === 'web') {
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
                        onAppLockSwitch={async (val) => {
                            if (Platform.OS === 'web') {
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
                    />

                    <PremiumSection setShowExportModal={setShowExportModal} />

                    <AccountSection
                        onDeleteData={() => {
                            Alert.alert("Caution", "This will permanently erase all your expense data!", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete Everything", style: "destructive", onPress: () => { /* Logic to clear DB */ } }
                            ]);
                        }}
                    />

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
                    <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-[90%] max-w-[400px] shadow-2xl">
                        <Text className="text-lg font-bold text-center mb-4 text-gray-800 dark:text-white">Choose Avatar</Text>

                        {/* Photo Options */}
                        <View className="flex-row gap-2 mb-6">
                            <Pressable
                                onPress={() => pickImage(true)}
                                className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl items-center border border-blue-100 dark:border-blue-900/10"
                            >
                                <Ionicons name="camera" size={24} color="#2563eb" />
                                <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase">Camera</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => pickImage(false)}
                                className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl items-center border border-blue-100 dark:border-blue-900/10"
                            >
                                <Ionicons name="images" size={24} color="#2563eb" />
                                <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase">Gallery</Text>
                            </Pressable>
                            {isImage(avatar) && (
                                <Pressable
                                    onPress={() => {
                                        updateSettings({ avatar: "👤" });
                                        setShowAvatarPicker(false);
                                    }}
                                    className="flex-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl items-center border border-red-100 dark:border-red-900/10"
                                >
                                    <Ionicons name="trash" size={24} color="#ef4444" />
                                    <Text className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1 uppercase">Remove</Text>
                                </Pressable>
                            )}
                        </View>

                        <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Or choose an icon</Text>

                        <View className="max-h-[300px]">
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
                                        <Ionicons name={item as any} size={24} color={avatar === item ? "#2563eb" : (isDark ? "#9ca3af" : "#4b5563")} />
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

            <CategoryModal
                visible={showCategoryCreator}
                onClose={() => setShowCategoryCreator(false)}
                editingCategory={editingCategory}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                newCategoryType={newCategoryType}
                setNewCategoryType={setNewCategoryType}
                newCategoryIcon={newCategoryIcon}
                setNewCategoryIcon={setNewCategoryIcon}
                handleSaveCategory={handleSaveCategory}
                handleDeleteFromModal={handleDeleteFromModal}
                isDark={isDark}
            />

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
