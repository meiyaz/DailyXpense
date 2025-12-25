import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettings } from '../store/SettingsContext';

const { width } = Dimensions.get('window');

export default function LockScreen() {
    const { setIsAppUnlocked, securityPin, appLockEnabled } = useSettings();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'web' && appLockEnabled) {
            authenticateNative();
        }
    }, []);

    const authenticateNative = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // Fallback to PIN if no biometrics or not enrolled
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
        if (pin.length >= 4) return;
        const newPin = pin + val;
        setPin(newPin);
        setError(false);

        if (newPin.length === 4) {
            if (newPin === securityPin) {
                setTimeout(() => setIsAppUnlocked(true), 100);
            } else {
                setError(true);
                setPin('');
                Alert.alert("Invalid PIN", "The PIN you entered is incorrect.");
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    return (
        <View className="flex-1 bg-white dark:bg-black items-center justify-center p-10">
            <View className="items-center mb-12">
                <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                    <Ionicons name="lock-closed" size={40} color="#2563eb" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">App Locked</Text>
                <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {Platform.OS === 'web' || !securityPin ? "Enter your security PIN to continue" : "Use biometrics or enter PIN"}
                </Text>
            </View>

            {/* PIN Dots */}
            <View className="flex-row gap-4 mb-12">
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 ${pin.length >= i
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-700'
                            } ${error ? 'border-red-500 bg-red-500' : ''}`}
                    />
                ))}
            </View>

            {/* Number Pad */}
            <View className="flex-row flex-wrap justify-between w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                    <TouchableOpacity
                        key={val}
                        onPress={() => handlePinPress(val.toString())}
                        className="w-20 h-20 items-center justify-center mb-4 rounded-full bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
                    >
                        <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{val}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    onPress={authenticateNative}
                    className="w-20 h-20 items-center justify-center rounded-full"
                >
                    {Platform.OS !== 'web' && (
                        <Ionicons name="finger-print" size={28} color="#2563eb" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handlePinPress('0')}
                    className="w-20 h-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-200">0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleDelete}
                    className="w-20 h-20 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <Ionicons name="backspace-outline" size={28} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* Forgot PIN Link */}
            <TouchableOpacity
                className="mt-12"
                onPress={() => Alert.alert("Coming Soon", "PIN recovery options will be available in a future update.")}
            >
                <Text className="text-blue-600 dark:text-blue-400 font-semibold">Forgot PIN?</Text>
            </TouchableOpacity>
        </View>
    );
}
