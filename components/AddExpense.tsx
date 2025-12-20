import { View, Text, TextInput, Pressable, Platform, Alert, Animated } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import { CategoryPicker } from "./CategoryPicker";
import { DatePicker } from "./ui/DatePicker";

export function AddExpense() {
    const { addExpense, expenses } = useExpenses();
    const { currency, categories, updateSettings } = useSettings();

    // Inputs
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date());
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

    // UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    // MRU Logic
    const getMRUCategories = () => {
        const recentExpenses = expenses.slice(0, 15);
        const frequency: Record<string, number> = {};
        recentExpenses.forEach(e => {
            frequency[e.category] = (frequency[e.category] || 0) + 1;
        });

        return [...categories].sort((a, b) => {
            const freqA = frequency[a.name] || 0;
            const freqB = frequency[b.name] || 0;
            return freqB - freqA;
        });
    };

    const sortedCategories = getMRUCategories();

    // Reset default category when opening
    useEffect(() => {
        if (isExpanded && !selectedCategory && sortedCategories.length > 0) {
            setSelectedCategory(sortedCategories[0].name);
        }
    }, [isExpanded]);

    const handleAmountChange = (text: string) => {
        if (/^\d*\.?\d{0,2}$/.test(text)) {
            setAmount(text);
        }
    };

    const handleSubmit = () => {
        if (!description.trim() || !amount || !selectedCategory) {
            Alert.alert("Missing Info", "Please fill in all fields.");
            return;
        }

        addExpense({
            description: description.trim(),
            amount: parseFloat(amount),
            date: date.toISOString(),
            category: selectedCategory
        });

        // Reset
        setDescription("");
        setAmount("");
        setDate(new Date());
        setIsExpanded(false);
    };

    const categoryObj = categories.find(c => c.name === selectedCategory);
    const tag = categoryObj ? categoryObj.name : "Category";

    if (!isExpanded) {
        return (
            <Pressable
                onPress={() => setIsExpanded(true)}
                className="bg-blue-600 rounded-full p-4 absolute bottom-6 right-6 shadow-lg z-50 items-center justify-center"
            >
                <Ionicons name="add" size={32} color="white" />
            </Pressable>
        );
    }

    return (
        <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 mb-6 shadow-xl border border-blue-50 dark:border-gray-800">
            {/* Header: Close Button */}
            <View className="flex-row justify-end items-center mb-0">
                <Pressable onPress={() => setIsExpanded(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full mb-2">
                    <Ionicons name="close" size={20} color="#9ca3af" />
                </Pressable>
            </View>

            {/* ROW 1: Description - No Border */}
            {/* ROW 1: Description - No Border */}
            <TextInput
                className="text-gray-900 dark:text-white font-semibold text-lg p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4"
                value={description}
                onChangeText={setDescription}
                placeholder="What is this?"
                placeholderTextColor="#9ca3af"
                autoFocus
                maxLength={50}
            />

            {/* ROW 2: Date | Amount - No Border */}
            <View className="flex-row items-center gap-3 mb-4">
                <View className="flex-1">
                    <DatePicker value={date} onChange={setDate} />
                </View>

                {/* Amount */}
                <View className="flex-1 flex-row items-center justify-end bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                    <Text className="font-bold mr-1 text-lg text-gray-400 dark:text-gray-500">
                        {currency}
                    </Text>
                    <TextInput
                        className="font-bold text-xl text-gray-900 dark:text-white min-w-[60px] text-right p-0"
                        value={amount}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* ROW 3: Category | Checkmark - No Border */}
            <View className="flex-row items-center justify-between pt-2">
                <Pressable
                    onPress={() => setShowCategoryPicker(true)}
                    className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-700"
                >
                    <View
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: selectedCategory ? categoryObj?.color : '#9ca3af' }}
                    />
                    <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold mr-1">
                        {tag}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color="#6b7280" />
                </Pressable>

                <Pressable
                    onPress={handleSubmit}
                    className="flex-row items-center px-5 py-2.5 rounded-xl bg-blue-600"
                >
                    <Text className="text-white font-bold text-sm mr-2">SAVE</Text>
                    <Ionicons name="checkmark" size={18} color="white" />
                </Pressable>
            </View>

            <CategoryPicker
                visible={showCategoryPicker}
                onClose={() => setShowCategoryPicker(false)}
                onSelect={setSelectedCategory}
                selectedCategory={selectedCategory}
                customCategories={sortedCategories}
            />
        </View>
    );
}
