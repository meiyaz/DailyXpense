import React from 'react';
import { Modal, Platform, Pressable, View, Text, ScrollView, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface SafeTimePickerProps {
    visible: boolean;
    date: Date;
    theme: 'light' | 'dark' | null;
    onClose: () => void;
    onChange: (event: DateTimePickerEvent, date?: Date) => void;
    onSaveIos: (date: Date) => void;
}

export function SafeTimePicker({ visible, date, theme, onClose, onChange, onSaveIos }: SafeTimePickerProps) {
    // Web specific implementation
    if (Platform.OS === 'web') {
        if (!visible) return null;

        return (
            <View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    position: 'fixed', // Web specific: ensures it covers window regardless of parent overflow
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999,
                    elevation: 5,
                } as any}
            >
                <View
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                    <Pressable
                        className="bg-white dark:bg-gray-900 p-6 rounded-3xl w-[90%] max-w-[350px] shadow-2xl"
                        style={{
                            backgroundColor: theme === 'dark' ? '#111827' : 'white',
                            padding: 24,
                            borderRadius: 24,
                            width: '90%',
                            maxWidth: 350,
                            maxHeight: '90%',
                            zIndex: 10000
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-bold text-center mb-6 text-gray-800 dark:text-white" style={{ marginBottom: 24, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: theme === 'dark' ? 'white' : '#1f2937' }}>Set Reminder Time</Text>

                        <View className="flex-row justify-center items-center mb-6 h-40">
                            {/* Hours (1-12) */}
                            <View className="h-full w-16 overflow-hidden mx-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 60 }}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                                        const currentH24 = date.getHours();
                                        const currentH12 = currentH24 % 12 || 12;
                                        const isSelected = currentH12 === h;
                                        return (
                                            <Pressable
                                                key={h}
                                                onPress={() => {
                                                    const newDate = new Date(date);
                                                    const isPM = currentH24 >= 12;
                                                    let newH24 = h;
                                                    if (isPM && h !== 12) newH24 = h + 12;
                                                    if (!isPM && h === 12) newH24 = 0;

                                                    // Maintain AM/PM but change hour relative to it? 
                                                    // Simpler: Just swap the hour part keeping AM/PM constant unless user switches AM/PM
                                                    if (isPM) {
                                                        newH24 = (h === 12) ? 12 : h + 12;
                                                    } else {
                                                        newH24 = (h === 12) ? 0 : h;
                                                    }

                                                    newDate.setHours(newH24);
                                                    onChange({ type: 'set', nativeEvent: {} } as any, newDate);
                                                }}
                                                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                                                className={`h-10 items-center justify-center ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                            >
                                                <Text className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                                                    {h}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <Text className="text-2xl font-bold text-gray-800 dark:text-white">:</Text>

                            {/* Minutes */}
                            <View className="h-full w-16 overflow-hidden mx-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 60 }}>
                                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
                                        <Pressable
                                            key={m}
                                            onPress={() => {
                                                const newDate = new Date(date);
                                                newDate.setMinutes(parseInt(m));
                                                onChange({ type: 'set', nativeEvent: {} } as any, newDate);
                                            }}
                                            style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                                            className={`h-10 items-center justify-center ${date.getMinutes() === parseInt(m) ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                        >
                                            <Text className={`text-lg font-bold ${date.getMinutes() === parseInt(m) ? 'text-primary' : 'text-gray-400'}`}>
                                                {m}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* AM/PM */}
                            <View className="h-full w-16 overflow-hidden mx-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 60 }}>
                                    {['AM', 'PM'].map((period) => {
                                        const isPM = date.getHours() >= 12;
                                        const isSelected = (period === 'PM' && isPM) || (period === 'AM' && !isPM);
                                        return (
                                            <Pressable
                                                key={period}
                                                onPress={() => {
                                                    const newDate = new Date(date);
                                                    const currentH = newDate.getHours();
                                                    if (period === 'AM' && currentH >= 12) {
                                                        newDate.setHours(currentH - 12);
                                                    } else if (period === 'PM' && currentH < 12) {
                                                        newDate.setHours(currentH + 12);
                                                    }
                                                    onChange({ type: 'set', nativeEvent: {} } as any, newDate);
                                                }}
                                                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                                                className={`h-10 items-center justify-center ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                            >
                                                <Text className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                                                    {period}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={onClose}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl items-center active:bg-gray-200 dark:active:bg-gray-700"
                            >
                                <Text className="font-bold text-gray-600 dark:text-gray-300">Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onSaveIos(date)}
                                className="flex-1 bg-primary p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none"
                            >
                                <Text className="font-bold text-white">Save Time</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </View>
            </View>
        );
    }

    // Android
    if (visible) {
        return (
            <DateTimePicker
                value={date}
                mode="time"
                display="default"
                is24Hour={false}
                onChange={onChange}
            />
        );
    }

    return null;
}
