import React from 'react';
import { Modal, Platform, Pressable, View, Text, ScrollView } from 'react-native';
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
            <Modal
                transparent={true}
                visible={visible}
                animationType="fade"
                onRequestClose={onClose}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        // Ensure it sits on top of everything in the Portal
                        zIndex: 9999
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
                            // Ensure the content itself is visible
                            zIndex: 10000
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-lg font-bold text-center mb-6 text-gray-800 dark:text-white" style={{ marginBottom: 24, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: theme === 'dark' ? 'white' : '#1f2937' }}>Set Reminder Time</Text>

                        <View className="flex-row justify-center items-center mb-6 h-40">
                            {/* Hours */}
                            <View className="h-full w-20 overflow-hidden mx-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 60 }}>
                                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((h) => (
                                        <Pressable
                                            key={h}
                                            onPress={() => {
                                                const newDate = new Date(date);
                                                newDate.setHours(parseInt(h));
                                                onChange({ type: 'set', nativeEvent: {} } as any, newDate);
                                            }}
                                            className={`h-10 items-center justify-center ${date.getHours() === parseInt(h) ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                        >
                                            <Text className={`text-lg font-bold ${date.getHours() === parseInt(h) ? 'text-primary' : 'text-gray-400'}`}>
                                                {h}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>

                            <Text className="text-2xl font-bold text-gray-800 dark:text-white">:</Text>

                            {/* Minutes */}
                            <View className="h-full w-20 overflow-hidden mx-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 60 }}>
                                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
                                        <Pressable
                                            key={m}
                                            onPress={() => {
                                                const newDate = new Date(date);
                                                newDate.setMinutes(parseInt(m));
                                                onChange({ type: 'set', nativeEvent: {} } as any, newDate);
                                            }}
                                            className={`h-10 items-center justify-center ${date.getMinutes() === parseInt(m) ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                                        >
                                            <Text className={`text-lg font-bold ${date.getMinutes() === parseInt(m) ? 'text-primary' : 'text-gray-400'}`}>
                                                {m}
                                            </Text>
                                        </Pressable>
                                    ))}
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
            </Modal>
        );
    }

    // Android
    if (visible) {
        return (
            <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={onChange}
            />
        );
    }

    return null;
}
