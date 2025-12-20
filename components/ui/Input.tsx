import { TextInput, TextInputProps, View, Text } from "react-native";

interface InputProps extends TextInputProps {
    label: string;
}

export function Input({ label, className, ...props }: InputProps) {
    return (
        <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-1">{label}</Text>
            <TextInput
                className={`border border-gray-300 rounded-lg p-3 bg-white ${className}`}
                placeholderTextColor="#9ca3af"
                {...props}
            />
        </View>
    );
}
