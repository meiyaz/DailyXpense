import { View, Text, Platform, Pressable } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
    const [show, setShow] = useState(false);

    const handleChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || value;
        if (Platform.OS === "android") {
            setShow(false);
        }
        onChange(currentDate);
    };

    if (Platform.OS === "web") {
        // Web implementation
        return (
            <View className={className}>
                {/* Removed Label */}
                <input
                    type="date"
                    value={value.toISOString().split("T")[0]}
                    onChange={(e) => onChange(new Date(e.target.value))}
                    className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    style={{
                        width: "auto",
                        minWidth: "150px",
                        colorScheme: "light dark" // This is the modern way to tell inputs to respect dark mode
                    }}
                />
            </View>
        );
    }

    // Mobile implementation
    return (
        <View className={className}>
            {/* Removed Label */}
            <Pressable
                onPress={() => setShow(true)}
                className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg"
            >
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300 font-medium">{value.toLocaleDateString()}</Text>
            </Pressable>
            {show && (
                <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={handleChange}
                />
            )}
        </View>
    );
}
