import { Modal, View, Text, Pressable, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../store/SettingsContext";
import { useExpenses } from "../store/ExpenseContext";
import { useState, useMemo } from "react";

interface CategoryPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (categoryName: string) => void;
    selectedCategory?: string;
    customCategories?: any[]; // Allow external sort override
    type?: 'expense' | 'income'; // Pass current transaction type
}

const AVAILABLE_ICONS = [
    "cart", "car", "fast-food", "game-controller",
    "home", "receipt", "medkit", "airplane",
    "bicycle", "book", "briefcase", "cafe",
    "camera", "card", "construct", "film",
    "fitness", "flower", "gift", "globe",
    "hammer", "heart", "key", "library",
    "map", "musical-notes", "paw", "phone-portrait",
    "restaurant", "school", "shirt", "ticket",
    "trophy", "wallet", "watch", "wine"
];

export function CategoryPicker({ visible, onClose, onSelect, selectedCategory, customCategories, type = 'expense' }: CategoryPickerProps) {
    const { categories: defaultCategories, addCategory } = useSettings();
    const { expenses } = useExpenses();
    const [isAdding, setIsAdding] = useState(false);

    // New Category State
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("pricetag");

    // Sort and filter categories by type and recent usage
    const filteredAndSortedCategories = useMemo(() => {
        // 1. Filter by type
        const typeFiltered = defaultCategories.filter(cat => cat.type === type);

        // 2. Get recent 15 expenses
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recent15 = sortedExpenses.slice(0, 15);

        // 3. Count usage (only for relevant categories)
        const counts: Record<string, number> = {};
        recent15.forEach(e => {
            if (e.category) {
                counts[e.category] = (counts[e.category] || 0) + 1;
            }
        });

        // 4. Sort
        return [...typeFiltered].sort((a, b) => {
            const countA = counts[a.name] || 0;
            const countB = counts[b.name] || 0;
            if (countB !== countA) return countB - countA;
            return 0;
        });
    }, [expenses, defaultCategories, type]);

    const displayCategories = customCategories || filteredAndSortedCategories;

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            setIsAdding(false);
            return;
        }

        // Simple random color generator
        const colors = ["#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#6366F1", "#EC4899", "#3B82F6", "#14B8A6"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        addCategory(newCategoryName.trim(), randomColor, selectedIcon, type);
        onSelect(newCategoryName.trim());
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setNewCategoryName("");
        setSelectedIcon("pricetag");
        setIsAdding(false);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
                <Pressable className="bg-white dark:bg-gray-900 rounded-t-3xl h-[70%] shadow-2xl" onPress={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
                        <Text className="text-xl font-bold text-gray-800 dark:text-white">
                            {isAdding ? "New Category" : "Select Category"}
                        </Text>
                        <Pressable onPress={() => { setIsAdding(false); onClose(); }} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <Ionicons name="close" size={20} color="#6b7280" />
                        </Pressable>
                    </View>

                    {isAdding ? (
                        <View className="flex-1 p-5">
                            {/* 1. Name Input */}
                            <Text className="text-sm font-bold text-gray-400 mb-2 uppercase">Name</Text>
                            <TextInput
                                className="text-xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6"
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                placeholder="e.g. Groceries"
                                placeholderTextColor="#9ca3af"
                                autoFocus
                            />

                            {/* 2. Icon Picker */}
                            <Text className="text-sm font-bold text-gray-400 mb-2 uppercase">Choose Icon</Text>
                            <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 mb-6">
                                <FlatList
                                    data={AVAILABLE_ICONS}
                                    keyExtractor={(item) => item}
                                    numColumns={6}
                                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            onPress={() => setSelectedIcon(item)}
                                            className={`w-10 h-10 items-center justify-center rounded-xl ${selectedIcon === item ? 'bg-blue-600' : 'bg-transparent'}`}
                                        >
                                            <Ionicons name={item as any} size={20} color={selectedIcon === item ? 'white' : '#6b7280'} />
                                        </Pressable>
                                    )}
                                />
                            </View>

                            {/* 3. Actions */}
                            <View className="flex-row gap-4">
                                <Pressable
                                    onPress={resetForm}
                                    className="flex-1 bg-gray-200 dark:bg-gray-800 p-4 rounded-xl items-center"
                                >
                                    <Text className="font-bold text-gray-600 dark:text-gray-400">Cancel</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleAddCategory}
                                    className={`flex-1 p-4 rounded-xl items-center ${newCategoryName.trim() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    disabled={!newCategoryName.trim()}
                                >
                                    <Text className={`font-bold ${newCategoryName.trim() ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>Create Category</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        /* Grid of Categories */
                        <ScrollView className="flex-1 p-5">
                            <View className="flex-row flex-wrap justify-between">
                                {displayCategories.map((cat) => {
                                    const isSelected = selectedCategory === cat.name;
                                    return (
                                        <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => {
                                                onSelect(cat.name);
                                                onClose();
                                            }}
                                            className="w-[30%] mb-6 items-center"
                                        >
                                            <View
                                                style={{
                                                    backgroundColor: cat.color,
                                                    shadowColor: cat.color,
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 5,
                                                    elevation: 5
                                                }}
                                                className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${isSelected ? 'border-4 border-white ring-2 ring-gray-900' : ''}`}
                                            >
                                                <Ionicons name={(cat.icon as any) || "pricetag"} size={32} color="white" />
                                                {isSelected && (
                                                    <View className="absolute -top-2 -right-2 bg-white rounded-full p-0.5">
                                                        <Ionicons name="checkmark-circle" size={20} color={cat.color} />
                                                    </View>
                                                )}
                                            </View>
                                            <Text className={`text-center text-xs font-medium ${isSelected ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`} numberOfLines={1}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Add New Button */}
                                <TouchableOpacity
                                    onPress={() => setIsAdding(true)}
                                    className="w-[30%] mb-6 items-center"
                                >
                                    <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700">
                                        <Ionicons name="add" size={32} color="#9ca3af" />
                                    </View>
                                    <Text className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                        New
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// Add these to interface if Ionicons names are strict, or just use string
