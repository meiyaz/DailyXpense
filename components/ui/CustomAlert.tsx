import { Modal, View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    buttons?: AlertButton[];
    onClose?: () => void;
}

export function CustomAlert({ visible, title, message, icon, buttons = [{ text: "OK" }], onClose }: CustomAlertProps) {
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    entering={ZoomIn.duration(200)}
                    exiting={ZoomOut.duration(150)}
                    style={styles.container}
                    className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl"
                >
                    {icon && (
                        <View className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${title.includes("PRO") || title.includes("Premium") ? 'bg-yellow-100' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Ionicons
                                name={icon}
                                size={24}
                                color={title.includes("PRO") || title.includes("Premium") ? '#ca8a04' : '#374151'}
                            />
                        </View>
                    )}

                    <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        {title}
                    </Text>

                    <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">
                        {message}
                    </Text>

                    <View className="flex-row gap-3 w-full justify-center">
                        {buttons.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            const isPrimary = !isCancel && !isDestructive || btn.style === 'default';

                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        if (onClose) onClose();
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl items-center justify-center active:opacity-80
                                        ${isPrimary ? 'bg-blue-600' : (isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800')}
                                    `}
                                >
                                    <Text className={`font-bold ${isPrimary ? 'text-white' : (isDestructive ? 'text-red-500' : 'text-gray-700 dark:text-gray-300')
                                        }`}>
                                        {btn.text}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    }
});
