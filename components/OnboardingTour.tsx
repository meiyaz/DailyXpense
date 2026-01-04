import React, { useState } from 'react';
import { View, Text, Modal, Image, TextInput, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../store/SettingsContext";
import { registerForPushNotificationsAsync, isNotificationSupported } from "../lib/notifications";
import { CustomAlert } from "./ui/CustomAlert";

interface OnboardingTourProps {
    visible: boolean;
    onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ visible, onComplete }) => {
    const { updateSettings } = useSettings();
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState("");
    const [pin, setPin] = useState("");
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

    const handleNext = async () => {
        if (step === 1) { // Nickname
            if (nickname.trim().length > 0) {
                updateSettings({ name: nickname.trim() });
                setStep(step + 1);
            } else {
                showCustomAlert("Required", "Please enter a name", "alert-circle");
            }
        } else if (step === 2) { // Reminders
            // Handled by specific button actions
            setStep(step + 1);
        } else if (step === 3) { // App Lock
            // Handled by specific button actions
            setStep(step + 1);
        } else if (step === 4) { // Quick Tip (Final)
            onComplete();
        } else {
            setStep(step + 1);
        }
    };

    const enableReminders = async () => {
        if (!isNotificationSupported()) {
            showCustomAlert(
                "Not Supported",
                "Notifications are not supported in this environment.",
                "alert-circle",
                [{ text: "OK", onPress: () => setStep(step + 1) }]
            );
            return;
        }

        const granted = await registerForPushNotificationsAsync();
        if (granted) {
            updateSettings({ notificationsEnabled: true, reminderTime: '21:00' }); // Default 9 PM
            setStep(step + 1);
        } else {
            showCustomAlert(
                "Permission Required",
                "Please enable notifications in settings to receive reminders.",
                "notifications-off",
                [
                    { text: "Skip", style: 'cancel', onPress: () => setStep(step + 1) },
                    { text: "Settings", onPress: () => Linking.openSettings() }
                ]
            );
        }
    };

    const setAppLock = () => {
        if (pin.length === 4) {
            updateSettings({ securityPin: pin, appLockEnabled: true });
            setStep(step + 1);
        } else {
            showCustomAlert("Invalid PIN", "Please enter a 4-digit PIN.", "alert-circle");
        }
    };

    const renderContent = () => (
        <View className="bg-white p-8 rounded-3xl w-full max-w-xs items-center shadow-xl">
            {step === 0 && (
                <>
                    <View className="w-24 h-24 bg-white/50 rounded-2xl items-center justify-center mb-6 shadow-sm overflow-hidden border border-gray-100/50 p-2">
                        <Image
                            source={require('../assets/logo_premium.jpg')}
                            style={{ width: '100%', height: '100%', borderRadius: 12 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome aboard!</Text>
                    <Text className="text-gray-500 mb-8 text-center leading-6">
                        I'm your new finance assistant. Let's get you set up in seconds.
                    </Text>
                    <Pressable
                        onPress={() => setStep(1)}
                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        <Text className="font-bold text-white text-lg">Let's Go</Text>
                    </Pressable>
                </>
            )}

            {step === 1 && (
                <View className="w-full">
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="person" size={30} color="#9333ea" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">First things first</Text>
                        <Text className="text-gray-500 text-center">What should we call you?</Text>
                    </View>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg mb-6 text-gray-900 text-center font-bold"
                        placeholder="Your Nickname"
                        value={nickname}
                        onChangeText={setNickname}
                        autoFocus
                    />
                    <Pressable
                        onPress={handleNext}
                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        <Text className="font-bold text-white text-lg">Next</Text>
                    </Pressable>
                </View>
            )}

            {step === 2 && (
                <View className="w-full">
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="notifications" size={30} color="#ea580c" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Stay on Track</Text>
                        <Text className="text-gray-500 text-center">Get a daily reminder at 9:00 PM to record your expenses?</Text>
                    </View>

                    <Pressable
                        onPress={enableReminders}
                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200 mb-3"
                    >
                        <Text className="font-bold text-white text-lg">Enable Reminder</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setStep(step + 1)}
                        className="w-full bg-gray-100 p-4 rounded-xl items-center active:bg-gray-200"
                    >
                        <Text className="font-bold text-gray-500">Skip</Text>
                    </Pressable>
                </View>
            )}

            {step === 3 && (
                <View className="w-full">
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-rose-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="lock-closed" size={30} color="#e11d48" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Secure your Data</Text>
                        <Text className="text-gray-500 text-center">Set a 4-digit PIN to lock the app?</Text>
                    </View>

                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg mb-6 text-gray-900 text-center font-bold tracking-widest"
                        placeholder="••••"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="numeric"
                        secureTextEntry
                        maxLength={4}
                        autoFocus
                    />

                    <Pressable
                        onPress={setAppLock}
                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200 mb-3"
                    >
                        <Text className="font-bold text-white text-lg">Set PIN</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setStep(step + 1)}
                        className="w-full bg-gray-100 p-4 rounded-xl items-center active:bg-gray-200"
                    >
                        <Text className="font-bold text-gray-500">Skip</Text>
                    </Pressable>
                </View>
            )}

            {step === 4 && (
                <>
                    <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                        <Ionicons name="add" size={40} color="#059669" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Quick Tip</Text>
                    <Text className="text-gray-500 mb-8 text-center leading-6">
                        Tap the <Text className="font-bold text-blue-600">+</Text> button at the bottom anytime to track a new expense instantly.
                    </Text>
                    <Pressable
                        onPress={onComplete}
                        className="w-full bg-gray-900 p-4 rounded-xl items-center active:bg-gray-800 shadow-lg"
                    >
                        <Text className="font-bold text-white text-lg">Got it!</Text>
                    </Pressable>
                </>
            )}

            <View className="flex-row gap-2 mt-8">
                {[0, 1, 2, 3, 4].map(s => (
                    <View
                        key={s}
                        className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'}`}
                    />
                ))}
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

    if (!visible) return null;

    if (Platform.OS === 'web') {
        return (
            <View
                className="justify-center items-center bg-black/80 px-4"
                style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
            >
                {renderContent()}
            </View>
        );
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { }}
        >
            <View className="flex-1 justify-center items-center bg-black/80 px-4">
                {renderContent()}
            </View>
        </Modal>
    );
};
