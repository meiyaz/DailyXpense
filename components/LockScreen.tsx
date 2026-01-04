import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettings } from '../store/SettingsContext';
import { useAuth } from '../store/AuthContext';

import { CustomAlert } from './ui/CustomAlert';
import { hashPin } from '../lib/crypto';

const { width } = Dimensions.get('window');

export default function LockScreen() {
    const { setIsAppUnlocked, securityPin, biometricsEnabled, appLockEnabled, updateSettings } = useSettings();
    const { user, sendOtp, verifyOtp, signOut } = useAuth();

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

    const [mode, setMode] = useState<'entry' | 'recovery_otp' | 'reset_pin'>('entry');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [showKeypad, setShowKeypad] = useState(!biometricsEnabled || Platform.OS === 'web');

    useEffect(() => {
        if (biometricsEnabled && Platform.OS !== 'web') {
            setShowKeypad(false);
        }
    }, [biometricsEnabled]);

    useEffect(() => {
        if (Platform.OS !== 'web' && appLockEnabled && biometricsEnabled && mode === 'entry') {
            authenticateNative();
        }
    }, [biometricsEnabled, appLockEnabled, mode]);

    const authenticateNative = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                if (!biometricsEnabled) {
                    showCustomAlert("Not Enabled", "Biometric authentication is not enabled or supported on this device.", "finger-print");
                } else {
                    showCustomAlert("Not Ready", "Biometric hardware is not available or no fingerprints/faces are enrolled.", "finger-print");
                }
                return;
            }

            if (!biometricsEnabled) {
                showCustomAlert("Notice", "Biometrics are supported but not enabled in Settings. Please enable them first.", "finger-print", [
                    { text: "Use PIN", style: "default" }
                ]);
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to unlock DailyXpense',
                fallbackLabel: 'Use PIN',
            });

            if (result.success) {
                setIsAppUnlocked(true);
            }
        } catch (e) {
            console.error("Native auth failed", e);
        }
    };

    const handlePinPress = (val: string) => {
        if (mode === 'entry') {
            if (pin.length >= 4) return;
            const updatedPin = pin + val;
            setPin(updatedPin);
            setError(false);

            if (updatedPin.length === 4) {
                // Hash input for verification
                hashPin(updatedPin).then(hashedInput => {
                    // Compare hash(input) == storedHash
                    if (hashedInput === securityPin) {
                        setTimeout(() => setIsAppUnlocked(true), 100);
                    } else {
                        setError(true);
                        setPin('');
                        showCustomAlert("Invalid PIN", "The PIN you entered is incorrect.", "close-circle");
                    }
                });
            }
        } else if (mode === 'reset_pin') {
            if (newPin.length >= 4) return;
            const updatedPin = newPin + val;
            setNewPin(updatedPin);

            if (updatedPin.length === 4) {
                // Hash new PIN before saving
                hashPin(updatedPin).then(hashedNewPin => {
                    updateSettings({ securityPin: hashedNewPin, appLockEnabled: true });
                    setIsAppUnlocked(true);
                    showCustomAlert("Success", "Your security PIN has been reset.", "checkmark-circle");
                });
            }
        }
    };

    const handleForgotPin = async () => {
        if (!user?.email) return;

        setLoading(true);
        try {
            const { error } = await sendOtp(user.email);
            if (error) {
                showCustomAlert("Error", error.message, "alert-circle");
            } else {
                setMode('recovery_otp');
                setOtp('');
            }
        } catch (e: any) {
            showCustomAlert("Error", e.message, "alert-circle");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRecoveryOtp = async () => {
        if (!user?.email || otp.length !== 6) return;

        setLoading(true);
        try {
            const { error } = await verifyOtp(user.email, otp);
            if (error) {
                showCustomAlert("Verification Failed", error.message || "The code you entered is invalid or expired.", "close-circle");
            } else {
                setMode('reset_pin');
                setNewPin('');
            }
        } catch (e: any) {
            showCustomAlert("Error", e.message, "alert-circle");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (mode === 'entry') setPin(pin.slice(0, -1));
        else if (mode === 'recovery_otp') setOtp(otp.slice(0, -1));
        else if (mode === 'reset_pin') setNewPin(newPin.slice(0, -1));
        setError(false);
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}
            className="flex-1 bg-white dark:bg-black"
            showsVerticalScrollIndicator={false}
        >
            {loading && (
                <View className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            )}

            <View className="items-center mb-12">
                <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                    <Ionicons
                        name={mode === 'entry' ? "lock-closed" : (mode === 'recovery_otp' ? "mail-open" : "key")}
                        size={40}
                        color="#2563eb"
                    />
                </View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mode === 'entry' ? "App Locked" : (mode === 'recovery_otp' ? "Verify Email" : "Reset PIN")}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {mode === 'entry'
                        ? (!showKeypad ? "Unlock with Biometrics" : "Enter your security PIN")
                        : (mode === 'recovery_otp' ? `Enter the code sent to ${user?.email}` : "Choose a new 4-digit security PIN")}
                </Text>
            </View>

            {/* Biometric-Only View */}
            {mode === 'entry' && !showKeypad && Platform.OS !== 'web' ? (
                <View className="items-center w-full">
                    <TouchableOpacity
                        onPress={authenticateNative}
                        className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-8 shadow-sm active:scale-95 transition-transform"
                    >
                        <Ionicons name="finger-print" size={48} color="#2563eb" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowKeypad(true)}
                        className="py-3 px-6"
                    >
                        <Text className="text-blue-600 dark:text-blue-400 font-semibold text-base">Use PIN instead</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* PIN/OTP Dots */}
                    <View className="flex-row gap-4 mb-12">
                        {Array.from({ length: mode === 'recovery_otp' ? 6 : 4 }).map((_, i) => {
                            let active = false;
                            if (mode === 'entry') active = pin.length > i;
                            else if (mode === 'recovery_otp') active = otp.length > i;
                            else if (mode === 'reset_pin') active = newPin.length > i;

                            return (
                                <View
                                    key={i}
                                    className={`w-4 h-4 rounded-full border-2 ${active
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300 dark:border-gray-700'
                                        } ${error && mode === 'entry' ? 'border-red-500 bg-red-500' : ''}`}
                                />
                            );
                        })}
                    </View>

                    {/* Number Pad */}
                    <View className="flex-row flex-wrap justify-between w-full max-w-[280px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                            <TouchableOpacity
                                key={val}
                                onPress={() => {
                                    if (mode === 'recovery_otp') {
                                        if (otp.length < 6) setOtp(otp + val);
                                    } else {
                                        handlePinPress(val.toString());
                                    }
                                }}
                                className="w-20 h-20 items-center justify-center mb-4 rounded-full bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
                            >
                                <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{val}</Text>
                            </TouchableOpacity>
                        ))}
                        {/* Zero Button */}
                        <View className="w-20 h-20" /> {/* Left Spacer */}

                        <TouchableOpacity
                            onPress={() => {
                                if (mode === 'recovery_otp') {
                                    if (otp.length < 6) setOtp(otp + '0');
                                } else if (mode === 'reset_pin') {
                                    if (newPin.length < 4) setNewPin(newPin + '0');
                                } else {
                                    // Entry mode
                                    handlePinPress('0');
                                }
                            }}
                            className="w-20 h-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
                        >
                            <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-200">0</Text>
                        </TouchableOpacity>

                        {/* Backspace Button */}
                        <TouchableOpacity
                            onPress={handleDelete}
                            className="w-20 h-20 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800"
                        >
                            <Ionicons name="backspace-outline" size={28} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    {/* Biometric Trigger (Separate from Keypad) */}
                    {mode === 'entry' && biometricsEnabled && Platform.OS !== 'web' && (
                        <TouchableOpacity
                            onPress={authenticateNative}
                            className="mt-4 flex-row items-center justify-center px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-full"
                        >
                            <Ionicons name="finger-print" size={20} color="#2563eb" style={{ marginRight: 8 }} />
                            <Text className="text-blue-600 dark:text-blue-400 font-semibold">Use Biometrics</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Recovery Actions */}
            <View className="mt-12 items-center">
                {mode === 'entry' ? (
                    <TouchableOpacity onPress={handleForgotPin}>
                        <Text className="text-blue-600 dark:text-blue-400 font-semibold text-base">Forgot PIN?</Text>
                    </TouchableOpacity>
                ) : mode === 'recovery_otp' ? (
                    <View className="items-center">
                        <TouchableOpacity
                            onPress={handleVerifyRecoveryOtp}
                            disabled={otp.length !== 6}
                            className={`mb-6 px-8 py-3 bg-blue-600 rounded-full ${otp.length !== 6 ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-white font-bold">Verify Code</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMode('entry')}>
                            <Text className="text-gray-400 font-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setMode('entry')}>
                        <Text className="text-gray-400 font-semibold">Cancel Reset</Text>
                    </TouchableOpacity>
                )}
            </View>


            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                buttons={alertConfig.buttons}
                onClose={closeAlert}
            />
        </ScrollView>
    );
}
