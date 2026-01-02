import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../store/SettingsContext";

interface CategoriesSectionProps {
    openCategoryEditor: (cat: any) => void;
    openCategoryCreator: () => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
    openCategoryEditor,
    openCategoryCreator
}) => {
    const { categories } = useSettings();

    return (
        <View className="mb-6">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Categories</Text>

            <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                    <Pressable
                        key={cat.id}
                        onPress={() => openCategoryEditor(cat)}
                        className="flex-row items-center bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 active:bg-gray-100 dark:active:bg-gray-800 border border-gray-100 dark:border-gray-800"
                    >
                        <Ionicons name={cat.icon as any || "pricetag"} size={12} color={cat.color} style={{ marginRight: 6 }} />
                        <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.name}</Text>
                    </Pressable>
                ))}

                <Pressable
                    onPress={openCategoryCreator}
                    className="flex-row items-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 active:bg-gray-50 dark:active:bg-gray-800"
                >
                    <Ionicons name="add" size={12} color="#9ca3af" />
                    <Text className="text-[10px] font-bold text-gray-400 ml-1">New</Text>
                </Pressable>
            </View>
        </View>
    );
};
