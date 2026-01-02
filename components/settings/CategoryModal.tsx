import React from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

const AVAILABLE_ICONS = [
    "cart", "car", "fast-food", "game-controller",
    "home", "receipt", "medkit", "airplane",
    "bicycle", "book", "briefcase", "cafe",
    "camera", "fitness", "flower", "gift", "globe",
    "hammer", "heart", "key", "library",
    "map", "musical-notes", "paw", "phone-portrait",
    "restaurant", "school", "shirt", "ticket",
    "trophy", "wallet", "watch", "wine",
    "person", "person-circle", "happy", "glasses", "woman", "man"
];

interface CategoryModalProps {
    visible: boolean;
    onClose: () => void;
    editingCategory: any;
    newCategoryName: string;
    setNewCategoryName: (val: string) => void;
    newCategoryType: 'expense' | 'income';
    setNewCategoryType: (val: 'expense' | 'income') => void;
    newCategoryIcon: string;
    setNewCategoryIcon: (val: string) => void;
    handleSaveCategory: () => void;
    handleDeleteFromModal: () => void;
    isDark: boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
    visible,
    onClose,
    editingCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryType,
    setNewCategoryType,
    newCategoryIcon,
    setNewCategoryIcon,
    handleSaveCategory,
    handleDeleteFromModal,
    isDark
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
                <Pressable className="bg-white dark:bg-gray-900 rounded-t-3xl h-[70%] shadow-2xl p-5" onPress={(e) => e.stopPropagation()}>
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-800 dark:text-white">{editingCategory ? "Edit Category" : "New Category"}</Text>
                        <Pressable onPress={onClose} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <Ionicons name="close" size={20} color="#6b7280" />
                        </Pressable>
                    </View>

                    <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Name</Text>
                        <TextInput
                            className="text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            placeholder="e.g. Subscriptions"
                            placeholderTextColor="#9ca3af"
                            autoFocus
                        />

                        <View className="flex-row gap-3 mb-6">
                            <Pressable
                                onPress={() => setNewCategoryType('expense')}
                                className={`flex-1 py-3 items-center rounded-xl border ${newCategoryType === 'expense' ? 'bg-red-50 border-red-500' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}
                            >
                                <Text className={`font-bold ${newCategoryType === 'expense' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>Expense</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setNewCategoryType('income')}
                                className={`flex-1 py-3 items-center rounded-xl border ${newCategoryType === 'income' ? 'bg-green-50 border-green-500' : 'bg-gray-50 dark:bg-gray-800 border-transparent'}`}
                            >
                                <Text className={`font-bold ${newCategoryType === 'income' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>Income</Text>
                            </Pressable>
                        </View>

                        <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Icon</Text>
                        <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 mb-6">
                            <FlatList
                                data={AVAILABLE_ICONS}
                                keyExtractor={(item) => item}
                                numColumns={6}
                                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                                renderItem={({ item }) => (
                                    <Pressable
                                        onPress={() => setNewCategoryIcon(item)}
                                        className={`w-10 h-10 items-center justify-center rounded-xl ${newCategoryIcon === item ? 'bg-blue-600' : 'bg-transparent'} `}
                                    >
                                        <Ionicons name={item as any} size={20} color={newCategoryIcon === item ? 'white' : (isDark ? '#9ca3af' : '#4b5563')} />
                                    </Pressable>
                                )}
                            />
                        </View>

                        <View className="gap-3">
                            <Pressable
                                onPress={handleSaveCategory}
                                className={`p-4 rounded-xl items-center ${newCategoryName.trim() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'} `}
                                disabled={!newCategoryName.trim()}
                            >
                                <Text className={`font-bold ${newCategoryName.trim() ? 'text-white' : 'text-gray-500 dark:text-gray-400'} `}>{editingCategory ? "Update Category" : "Create Category"}</Text>
                            </Pressable>

                            {editingCategory && (
                                <Pressable
                                    onPress={handleDeleteFromModal}
                                    className="p-4 rounded-xl items-center bg-red-50 dark:bg-red-900/20"
                                >
                                    <Text className="font-bold text-red-600 dark:text-red-400">Delete Category</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};
