import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Platform, Linking, Modal, useColorScheme as useRNColorScheme } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../store/SettingsContext";
import { useExpenses } from "../store/ExpenseContext";
import { registerForPushNotificationsAsync, isNotificationSupported } from "../lib/notifications";
import { CustomAlert } from "./ui/CustomAlert";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface OnboardingTourProps {
    visible: boolean;
    onComplete: () => void;
    isWelcomeBack?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ visible, onComplete, isWelcomeBack = false }) => {
    const { theme, updateSettings, name, avatar: settingsAvatar, resetToDefaults } = useSettings();
    const { resetExpenses } = useExpenses();
    const systemScheme = useRNColorScheme();
    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

    // Start at -1 if it's a welcome back scenario
    const [step, setStep] = useState(isWelcomeBack ? -1 : 0);
    const [nickname, setNickname] = useState("");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [pinSubStep, setPinSubStep] = useState<'enter' | 'confirm'>('enter');
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        icon: undefined as any,
        buttons: [] as any[]
    });

    const pulseValue = useSharedValue(1);
    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }]
    }));

    useEffect(() => {
        if (visible) {
            pulseValue.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            pulseValue.value = 1;
        }
    }, [visible]);

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
    const showCustomAlert = (title: string, message: string, icon: any, buttons: any[] = [{ text: "OK" }]) => {
        setAlertConfig({ visible: true, title, message, icon, buttons });
    };

    const isIcon = (str: string) => str && (str.includes("-") || str === "person" || str === "person-circle" || str === "happy" || str === "glasses" || str === "woman" || str === "man" || str === "pricetag" || str === "👤");
    const isImage = (str: string) => str && (str.startsWith('data:image') || str.startsWith('file://') || str.startsWith('http'));
    const avatar = settingsAvatar || "👤";

    const handleNext = async () => {
        if (step === 1) {
            if (nickname.trim().length > 0) {
                updateSettings({ name: nickname.trim() });
                setStep(s => s + 1);
            } else {
                showCustomAlert("Required", "Please enter a name", "alert-circle");
            }
        } else {
            setStep(s => s + 1);
        }
    };

    const enableReminders = async () => {
        if (!isNotificationSupported()) {
            showCustomAlert(
                "Not Supported",
                "Notifications are not supported in this environment.",
                "alert-circle",
                [{ text: "OK", onPress: () => setStep(s => s + 1) }]
            );
            return;
        }

        const granted = await registerForPushNotificationsAsync();
        if (granted) {
            updateSettings({ notificationsEnabled: true, reminderTime: '21:00' });
            setStep(s => s + 1);
        } else {
            showCustomAlert(
                "Permission Required",
                "Please enable notifications in settings to receive reminders.",
                "notifications-off",
                [
                    { text: "Skip", style: 'cancel', onPress: () => setStep(s => s + 1) },
                    { text: "Settings", onPress: () => Linking.openSettings() }
                ]
            );
        }
    };

    const setAppLock = () => {
        if (pinSubStep === 'enter') {
            if (pin.length === 4) {
                setPinSubStep('confirm');
                setConfirmPin("");
            } else {
                showCustomAlert("Invalid PIN", "Please enter a 4-digit PIN.", "alert-circle");
            }
        } else {
            if (confirmPin.length === 4) {
                if (pin === confirmPin) {
                    updateSettings({ securityPin: pin, appLockEnabled: true });
                    setStep(s => s + 1);
                    setPin("");
                    setConfirmPin("");
                    setPinSubStep('enter');
                } else {
                    showCustomAlert("PIN Mismatch", "The PINs you entered don't match.", "close-circle");
                    setPinSubStep('enter');
                    setPin("");
                    setConfirmPin("");
                }
            } else {
                showCustomAlert("Invalid PIN", "Please enter a 4-digit PIN.", "alert-circle");
            }
        }
    };

    const activateProTrial = () => {
        updateSettings({ isPremium: true, automaticCloudSync: true });
        showCustomAlert(
            "Welcome to Pro!",
            "We've enabled all Pro features for you. Step inside the future of finance.",
            "sparkles",
            [{ text: "Let's Go!", onPress: () => setStep(s => s + 1) }]
        );
    };

    const renderStep = () => {
        const textMain = isDark ? "text-white" : "text-gray-900";
        const textSub = isDark ? "text-white/70" : "text-gray-500";
        const cardBg = isDark ? "bg-white/10" : "bg-white/80";
        const cardBorder = isDark ? "border-white/10" : "border-gray-200";
        const inputBg = isDark ? "bg-white/20" : "bg-gray-100";

        const hour = new Date().getHours();
        const greeting = hour >= 5 && hour < 12 ? "Good Morning" : (hour >= 12 && hour < 17 ? "Good Afternoon" : "Good Evening");

        switch (step) {
            case -1: // Welcome Back Mode
                return (
                    <Animated.View
                        key="stepBack"
                        entering={FadeIn.duration(800)}
                        exiting={FadeOut.duration(400)}
                        className="items-center justify-center flex-1 px-8"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(300).springify()}
                            className={`w-32 h-32 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-full items-center justify-center mb-8 shadow-2xl border ${isDark ? 'border-white/20' : 'border-gray-100'}`}
                        >
                            {isImage(avatar) ? (
                                <Image source={{ uri: avatar }} className="w-[85%] h-[85%] rounded-full" />
                            ) : (
                                <View className="w-full h-full items-center justify-center">
                                    <Text className="text-5xl">{avatar}</Text>
                                </View>
                            )}
                        </Animated.View>
                        <Animated.Text
                            entering={FadeInUp.delay(500).duration(800)}
                            className={`text-4xl font-black ${textMain} mb-2 text-center tracking-tight`}
                        >
                            {greeting}{name ? `, ${name}` : ""}!
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInUp.delay(700).duration(800)}
                            className={`text-xl ${textSub} mb-12 text-center leading-7 font-medium`}
                        >
                            Ready to master your finances today?
                        </Animated.Text>
                        <TouchableOpacity
                            onPress={onComplete}
                            activeOpacity={0.8}
                            className={`w-full ${isDark ? 'bg-white' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-2xl`}
                        >
                            <Text className={`font-black ${isDark ? 'text-blue-900' : 'text-white'} text-xl tracking-widest uppercase`}>Let's Go!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 0:
                return (
                    <Animated.View
                        key="step0"
                        entering={FadeIn.duration(800)}
                        exiting={FadeOut.duration(400)}
                        className="items-center justify-center flex-1 px-8"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(300).springify()}
                            className={`w-32 h-32 ${isDark ? 'bg-white/20' : 'bg-white'} rounded-3xl items-center justify-center mb-10 shadow-2xl border ${isDark ? 'border-white/30' : 'border-gray-100'}`}
                        >
                            <Image
                                source={require('../assets/logo_premium.jpg')}
                                style={{ width: '85%', height: '85%', borderRadius: 18 }}
                                resizeMode="contain"
                            />
                        </Animated.View>
                        <Animated.Text
                            entering={FadeInUp.delay(500).duration(800)}
                            className={`text-4xl font-black ${textMain} mb-4 text-center tracking-tight`}
                        >
                            DailyXpense
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInUp.delay(700).duration(800)}
                            className={`text-xl ${textSub} mb-12 text-center leading-7 font-medium`}
                        >
                            Your elegant journey to financial freedom starts here.
                        </Animated.Text>
                        <TouchableOpacity
                            onPress={async () => {
                                // FRESH START: Clear any old data
                                resetToDefaults();
                                await resetExpenses();
                                setStep(s => s + 1);
                            }}
                            activeOpacity={0.8}
                            className={`w-full ${isDark ? 'bg-white' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-2xl`}
                        >
                            <Text className={`font-black ${isDark ? 'text-blue-900' : 'text-white'} text-xl tracking-widest uppercase`}>Get Started</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 1:
                return (
                    <Animated.View
                        key="step1"
                        entering={SlideInRight.duration(600)}
                        exiting={SlideOutLeft.duration(600)}
                        className="flex-1 justify-center px-8"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            className="w-20 h-20 bg-purple-500/20 rounded-full items-center justify-center mb-8 self-center border border-purple-500/30"
                        >
                            <Ionicons name="person" size={40} color={isDark ? "#e9d5ff" : "#9333ea"} />
                        </Animated.View>
                        <Text className={`text-3xl font-black ${textMain} mb-2 text-center`}>Hello!</Text>
                        <Text className={`text-lg ${textSub} mb-10 text-center`}>What should we call you?</Text>

                        <View className={`w-full rounded-2xl border ${cardBorder} ${inputBg} overflow-hidden mb-8 shadow-sm`}>
                            <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"}>
                                <TextInput
                                    className={`w-full p-6 text-2xl ${isDark ? 'text-white' : 'text-gray-900'} text-center font-bold`}
                                    placeholder="Your Nickname"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
                                    value={nickname}
                                    onChangeText={setNickname}
                                    returnKeyType="done"
                                    onSubmitEditing={handleNext}
                                    autoFocus
                                />
                            </BlurView>
                        </View>

                        <TouchableOpacity
                            onPress={handleNext}
                            activeOpacity={0.8}
                            className={`w-full ${isDark ? 'bg-white' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-xl`}
                        >
                            <Text className={`font-bold ${isDark ? 'text-blue-900' : 'text-white'} text-xl`}>Continue</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 2:
                return (
                    <Animated.View
                        key="step2"
                        entering={SlideInRight.duration(600)}
                        exiting={SlideOutLeft.duration(600)}
                        className="flex-1 justify-center px-8"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            className="w-20 h-20 bg-orange-500/20 rounded-full items-center justify-center mb-8 self-center border border-orange-500/30"
                        >
                            <Ionicons name="notifications" size={40} color={isDark ? "#ffedd5" : "#ea580c"} />
                        </Animated.View>
                        <Text className={`text-3xl font-black ${textMain} mb-2 text-center`}>Stay Mindful</Text>
                        <Text className={`text-lg ${textSub} mb-12 text-center`}>We'll provide a gentle nudge at 9 PM to help you capture your day.</Text>

                        <TouchableOpacity
                            onPress={enableReminders}
                            activeOpacity={0.8}
                            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                            className={`w-full ${isDark ? 'bg-white' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-xl mb-4`}
                        >
                            <Text className={`font-bold ${isDark ? 'text-blue-900' : 'text-white'} text-xl`}>Enable Reminders</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setStep(s => s + 1)}
                            activeOpacity={0.6}
                            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                            className="w-full py-4 rounded-2xl items-center"
                        >
                            <Text className={`font-bold ${isDark ? 'text-white/50' : 'text-gray-400'} text-lg`}>Skip for now</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 3:
                return (
                    <Animated.View
                        key="step3"
                        entering={SlideInRight.duration(600)}
                        exiting={SlideOutLeft.duration(600)}
                        className="flex-1 justify-center px-8"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            className="w-20 h-20 bg-rose-500/20 rounded-full items-center justify-center mb-8 self-center border border-rose-500/30"
                        >
                            <Ionicons name="lock-closed" size={40} color={isDark ? "#ffe4e6" : "#e11d48"} />
                        </Animated.View>
                        <Text className={`text-3xl font-black ${textMain} mb-2 text-center`}>
                            {pinSubStep === 'enter' ? 'Vault Security' : 'Confirm Access'}
                        </Text>
                        <Text className={`text-lg ${textSub} mb-10 text-center`}>
                            {pinSubStep === 'enter' ? 'Keep your financial secrets safe with a private 4-digit PIN.' : 'Please re-enter your PIN to ensure it\'s perfectly set.'}
                        </Text>

                        <View className={`w-full rounded-2xl border ${cardBorder} ${inputBg} overflow-hidden mb-8 shadow-sm`}>
                            <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"}>
                                <TextInput
                                    className={`w-full p-6 text-4xl ${isDark ? 'text-white' : 'text-gray-900'} text-center font-black tracking-[15px]`}
                                    style={{ textAlign: 'center' }}
                                    placeholder="••••"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
                                    value={pinSubStep === 'enter' ? pin : confirmPin}
                                    onChangeText={pinSubStep === 'enter' ? setPin : setConfirmPin}
                                    returnKeyType="done"
                                    onSubmitEditing={setAppLock}
                                    keyboardType="numeric"
                                    secureTextEntry
                                    maxLength={4}
                                    autoFocus
                                    caretHidden={true}
                                />
                            </BlurView>
                        </View>

                        <TouchableOpacity
                            onPress={setAppLock}
                            activeOpacity={0.8}
                            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                            className={`w-full ${isDark ? 'bg-white' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-xl mb-4`}
                        >
                            <Text className={`font-bold ${isDark ? 'text-blue-900' : 'text-white'} text-xl uppercase tracking-widest`}>{pinSubStep === 'enter' ? 'Secure My Vault' : 'Finish Setup'}</Text>
                        </TouchableOpacity>
                        {pinSubStep === 'enter' && (
                            <TouchableOpacity
                                onPress={() => {
                                    setStep(s => s + 1);
                                    setPin("");
                                    setConfirmPin("");
                                    setPinSubStep('enter');
                                }}
                                activeOpacity={0.6}
                                hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                                className="w-full py-4 rounded-2xl items-center"
                            >
                                <Text className={`font-bold ${isDark ? 'text-white/50' : 'text-gray-400'} text-lg`}>I'll do this later</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                );

            case 4:
                return (
                    <Animated.View
                        key="step4"
                        entering={SlideInRight.duration(600)}
                        exiting={SlideOutLeft.duration(600)}
                        className="flex-1 justify-center px-8"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            className="w-20 h-20 bg-amber-500/20 rounded-full items-center justify-center mb-8 self-center border border-amber-500/30"
                        >
                            <Ionicons name="sparkles" size={40} color={isDark ? "#fef3c7" : "#d97706"} />
                        </Animated.View>
                        <Text className={`text-3xl font-black ${textMain} mb-2 text-center`}>Go Professional</Text>
                        <Text className={`text-lg ${textSub} mb-10 text-center`}>Elevate your experience with DailyXpense Pro.</Text>

                        <View className="mb-10">
                            {[
                                { icon: "analytics", title: "Spend Review Pro", desc: "AI-driven insights & visual intelligence", color: "#3b82f6", delay: 300 },
                                { icon: "cloud-done", title: "Instant Backup", desc: "Private cloud sync across all devices", color: "#10b981", delay: 500 },
                                { icon: "download", title: "Premium Exports", desc: "Clean Excel & PDF reports for taxes", color: "#8b5cf6", delay: 700 },
                            ].map((item, i) => (
                                <Animated.View
                                    key={i}
                                    entering={FadeInDown.delay(item.delay).duration(600)}
                                    className={`flex-row items-center ${cardBg} p-4 rounded-2xl border ${cardBorder} mb-3`}
                                >
                                    <View style={{ backgroundColor: `${item.color}44` }} className={`w-12 h-12 rounded-xl items-center justify-center mr-4 border ${cardBorder}`}>
                                        <Ionicons name={item.icon as any} size={24} color={isDark ? "#fff" : item.color} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-bold ${textMain} text-base`}>{item.title}</Text>
                                        <Text className={`${textSub} text-xs`}>{item.desc}</Text>
                                    </View>
                                </Animated.View>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={activateProTrial}
                            activeOpacity={0.8}
                            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                            className={`w-full ${isDark ? 'bg-white' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-xl mb-4`}
                        >
                            <Text className={`font-bold ${isDark ? 'text-blue-900' : 'text-white'} text-xl tracking-tight`}>Sounds Incredible</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setStep(s => s + 1)}
                            activeOpacity={0.6}
                            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                            className="w-full py-4 rounded-2xl items-center"
                        >
                            <Text className={`font-bold ${isDark ? 'text-white/50' : 'text-gray-400'} text-lg`}>Skip for now</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 5:
                return (
                    <Animated.View
                        key="step5"
                        entering={FadeIn.duration(1000)}
                        className="flex-1 justify-center px-8 items-center"
                        pointerEvents="box-none"
                    >
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            className="w-32 h-32 bg-green-500/20 rounded-full items-center justify-center mb-8 border-2 border-green-500/50"
                            pointerEvents="box-none"
                        >
                            <Ionicons name="checkmark-circle" size={80} color="#4ade80" />
                        </Animated.View>
                        <Text className={`text-4xl font-black ${textMain} mb-4 text-center`}>All Set!</Text>
                        <Text className={`text-xl ${textSub} mb-12 text-center max-w-[280px] leading-7`}>
                            Tap the <Text className={`${textMain} font-black`}>+</Text> button at the bottom of the home screen to log your first transaction.
                        </Text>
                        <TouchableOpacity
                            onPress={onComplete}
                            activeOpacity={0.8}
                            className={`w-full ${isDark ? 'bg-blue-600' : 'bg-gray-900'} py-5 rounded-2xl items-center shadow-2xl`}
                        >
                            <Text className="font-black text-white text-xl tracking-widest uppercase">Take Me There</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    const renderContent = () => (
        <View style={StyleSheet.absoluteFill} className={isDark ? "bg-black" : "bg-white"}>
            <LinearGradient
                colors={isDark ? ['#1e3a8a', '#1e1b4b', '#0f172a'] : ['#eff6ff', '#f8fafc', '#ffffff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View className="flex-1">
                    {renderStep()}
                </View>

                {/* Footer Dots (Only for multi-step onboarding) */}
                {!isWelcomeBack && step >= 0 && (
                    <View className="flex-row justify-center gap-3 mb-10">
                        {[0, 1, 2, 3, 4, 5].map(s => (
                            <View
                                key={s}
                                className={`h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'} shadow-sm`}
                                style={{
                                    width: step === s ? 30 : 8,
                                    opacity: step === s ? 1 : 0.2
                                }}
                            />
                        ))}
                    </View>
                )}
            </SafeAreaView>

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

    const tourContent = (
        <View
            style={[
                StyleSheet.absoluteFill,
                { zIndex: 1000 },
                Platform.OS === 'web' && { position: 'fixed' as any }
            ]}
        >
            {renderContent()}
        </View>
    );

    return tourContent;
};
