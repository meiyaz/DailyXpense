import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettings } from '../store/SettingsContext';
import { useAuth } from '../store/AuthContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function LockScreen() {
    const { setIsAppUnlocked, securityPin, biometricsEnabled, appLockEnabled, updateSettings } = useSettings();
    const { user, sendOtp, verifyOtp, signOut } = useAuth();
    const router = useRouter();

    const [mode, setMode] = useState<'entry' | 'recovery_otp' | 'reset_pin'>('entry');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

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
                    Alert.alert("Not Enabled", "Biometric authentication is not enabled or supported on this device.");
                } else {
                    Alert.alert("Not Ready", "Biometric hardware is not available or no fingerprints/faces are enrolled.");
                }
                return;
            }

            if (!biometricsEnabled) {
                Alert.alert("Notice", "Biometrics are supported but not enabled in Settings. Please enable them first.", [
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
                if (updatedPin === securityPin) {
                    setTimeout(() => setIsAppUnlocked(true), 100);
                } else {
                    setError(true);
                    setPin('');
                    Alert.alert("Invalid PIN", "The PIN you entered is incorrect.");
                }
            }
        } else if (mode === 'reset_pin') {
            if (newPin.length >= 4) return;
            const updatedPin = newPin + val;
            setNewPin(updatedPin);

            if (updatedPin.length === 4) {
                updateSettings({ securityPin: updatedPin, appLockEnabled: true });
                setIsAppUnlocked(true);
                Alert.alert("Success", "Your security PIN has been reset.");
            }
        }
    };

    const handleForgotPin = async () => {
        if (!user?.email) return;

        setLoading(true);
        try {
            const { error } = await sendOtp(user.email);
            if (error) {
                Alert.alert("Error", error.message);
            } else {
                setMode('recovery_otp');
                setOtp('');
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
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
                Alert.alert("Verification Failed", "The code you entered is invalid or expired.");
            } else {
                setMode('reset_pin');
                setNewPin('');
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
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
        <View className="flex-1 bg-white dark:bg-black items-center justify-center p-10">
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
                        ? (Platform.OS === 'web' || !securityPin ? "Enter your security PIN to continue" : "Use biometrics or enter PIN")
                        : (mode === 'recovery_otp' ? `Enter the code sent to ${user?.email}` : "Choose a new 4-digit security PIN")}
                </Text>
            </View>

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
                <TouchableOpacity
                    onPress={() => {
                        if (mode === 'entry') authenticateNative();
                        else if (mode === 'recovery_otp') {
                            if (otp.length < 6) setOtp(otp + '0');
                        } else {
                            handlePinPress('0');
                        }
                    }}
                    className="w-20 h-20 items-center justify-center rounded-full"
                >
                    {mode === 'entry' ? (
                        Platform.OS !== 'web' && (
                            <Ionicons name="finger-print" size={28} color="#2563eb" />
                        )
                    ) : (
                        <View className="w-20 h-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800">
                            <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-200">0</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {mode === 'entry' ? (
                    <TouchableOpacity
                        onPress={() => handlePinPress('0')}
                        className="w-20 h-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
                    >
                        <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-200">0</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="w-20 h-20" /> // Spacer
                )}

                <TouchableOpacity
                    onPress={handleDelete}
                    className="w-20 h-20 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <Ionicons name="backspace-outline" size={28} color="#9ca3af" />
                </TouchableOpacity>
            </View>

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

            {/* Logout Option as last resort */}
            {mode !== 'entry' && (
                <TouchableOpacity
                    className="mt-8"
                    onPress={() => {
                        Alert.alert("Sign Out", "Are you sure you want to sign out? You will need to login again with your email.", [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Sign Out", style: "destructive", onPress: async () => {
                                    await signOut();
                                    // layout handles redirection
                                }
                            }
                        ]);
                    }}
                >
                    <Text className="text-red-400 font-medium text-xs uppercase tracking-widest">or sign out</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
