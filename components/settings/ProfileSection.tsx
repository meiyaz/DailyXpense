import React from 'react';
import { View, Text, TextInput, Pressable, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../store/AuthContext";
import { useSettings } from "../../store/SettingsContext";

interface ProfileSectionProps {
    isEditingName: boolean;
    setIsEditingName: (val: boolean) => void;
    newName: string;
    setNewName: (val: string) => void;
    handleSaveName: () => void;
    setShowAvatarPicker: (val: boolean) => void;
}

const PROFILE_ICONS = [
    "person", "person-circle", "person-add", "people", "briefcase",
    "school", "business", "laptop", "easel", "library",
    "glasses", "shirt", "happy", "star", "heart"
];

export const ProfileSection: React.FC<ProfileSectionProps> = ({
    isEditingName,
    setIsEditingName,
    newName,
    setNewName,
    handleSaveName,
    setShowAvatarPicker
}) => {
    const { user } = useAuth();
    const { name, avatar, isPremium } = useSettings();

    const isIcon = (str: string) => str && (str.includes("-") || str === "person" || str === "person-circle" || str === "happy" || str === "glasses" || str === "woman" || str === "man" || str === "pricetag");
    const isImage = (str: string) => str && (str.startsWith('data:image') || str.startsWith('file://') || str.startsWith('http'));

    return (
        <View className="items-center mb-8 mt-2">
            <TouchableOpacity
                onPress={() => setShowAvatarPicker(true)}
                className={`w-20 h-20 rounded-full items-center justify-center mb-3 border-2 relative ${isPremium ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'}`}
            >
                {isImage(avatar) ? (
                    <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />
                ) : isIcon(avatar) || PROFILE_ICONS.includes(avatar) ? (
                    <Ionicons name={avatar as any} size={40} color={isPremium ? "#d97706" : "#2563eb"} />
                ) : (
                    <Text className="text-4xl">{avatar || "👤"}</Text>
                )}

                <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 border-2 border-white dark:border-black shadow-sm z-20">
                    <Ionicons name="pencil" size={10} color="white" />
                </View>
            </TouchableOpacity>

            {isEditingName ? (
                <View className="flex-row items-center">
                    <TextInput
                        className="border-b border-blue-600 py-0 text-xl font-bold text-gray-900 dark:text-white min-w-[120px] text-center"
                        value={newName}
                        onChangeText={setNewName}
                        autoFocus
                        onSubmitEditing={handleSaveName}
                    />
                    <Pressable onPress={handleSaveName} className="ml-2 absolute -right-8">
                        <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                    </Pressable>
                </View>
            ) : (
                <Pressable onPress={() => setIsEditingName(true)} className="flex-row items-center">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white mr-2">{name || "Your Name"}</Text>
                    <Ionicons name="pencil-outline" size={16} color="#9ca3af" />
                </Pressable>
            )}
            {user?.email && (
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</Text>
            )}
        </View>
    );
};
