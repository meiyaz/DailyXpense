import { View, Text, Pressable, TextInput, Alert, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Expense, useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { useState } from "react";
import { DatePicker } from "./ui/DatePicker";
import { CategoryPicker } from "./CategoryPicker";

interface ExpenseListItemProps {
    expense: Expense;
    isLast?: boolean;
}

export function ExpenseListItem({ expense, isLast }: ExpenseListItemProps) {
    const { deleteExpense, updateExpense } = useExpenses();
    const { currency, categories } = useSettings();
    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [description, setDescription] = useState(expense.description);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [date, setDate] = useState(new Date(expense.date));
    const [selectedCategory, setSelectedCategory] = useState(expense.category);

    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

    const categoryObj = categories.find(c => c.name === (isEditing ? selectedCategory : expense.category));
    const catColor = categoryObj ? categoryObj.color : "#9ca3af";
    const catIcon: any = categoryObj ? categoryObj.icon : "pricetag";

    const handleDelete = () => {
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteExpense(expense.id) }
        ]);
    };

    const handleSave = () => {
        if (!description.trim() || !amount) return;
        updateExpense(expense.id, {
            description: description.trim(),
            amount: parseFloat(amount),
            date: date.toISOString(),
            category: selectedCategory
        });
        setIsEditing(false);
    };

    const handleAmountChange = (text: string) => {
        if (/^\d*\.?\d{0,2}$/.test(text)) setAmount(text);
    };

    if (isEditing) {
        return (
            <View className={`bg-blue-50/50 p-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                {/* Header Close */}
                <View className="flex-row justify-end items-center mb-2">
                    <Pressable onPress={() => setIsEditing(false)}>
                        <Ionicons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                </View>

                {/* ROW 1: Description - No Border */}
                <TextInput
                    className="text-gray-900 font-bold text-base p-2 bg-white rounded-lg mb-3"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description"
                />

                {/* ROW 2: Date | Amount - No Border */}
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="flex-1">
                        <DatePicker value={date} onChange={setDate} />
                    </View>
                    <View className="flex-1 flex-row items-center justify-end bg-white rounded-lg px-2 py-2">
                        <Text className="font-bold mr-1 text-base text-gray-400">
                            {currency}
                        </Text>
                        <TextInput
                            className="font-bold text-lg text-gray-900 min-w-[50px] text-right p-0"
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* ROW 3: Category | Actions - No Border */}
                <View className="flex-row items-center justify-between">
                    <Pressable
                        onPress={() => setCategoryPickerVisible(true)}
                        className="flex-row items-center bg-white px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: catColor }} />
                        <Text className="text-gray-700 text-xs font-semibold">{selectedCategory}</Text>
                    </Pressable>

                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={handleDelete}
                            className="p-2 rounded-full bg-red-50"
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </Pressable>

                        <Pressable
                            onPress={handleSave}
                            className="p-2 rounded-full bg-blue-100"
                        >
                            <Ionicons name="checkmark" size={20} color="#2563eb" />
                        </Pressable>
                    </View>
                </View>

                <CategoryPicker
                    visible={categoryPickerVisible}
                    onClose={() => setCategoryPickerVisible(false)}
                    onSelect={setSelectedCategory}
                    selectedCategory={selectedCategory}
                />
            </View>
        );
    }

    // View Mode Layout
    return (
        <View className={`flex-row items-center justify-between p-4 bg-white dark:bg-gray-900 ${!isLast ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
            {/* Left: Icon + Info */}
            <View className="flex-row items-center flex-1 mr-4">
                {/* Icon Background */}
                <View
                    style={{ backgroundColor: `${catColor}15` }} // 15% opacity
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                >
                    <Ionicons name={catIcon} size={20} color={catColor} />
                </View>

                {/* Text Info */}
                <View className="flex-1">
                    <Text className="text-gray-800 dark:text-gray-100 font-bold text-base leading-tight mb-0.5" numberOfLines={1}>
                        {expense.description}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded mr-2">
                            <View style={{ backgroundColor: catColor }} className="w-1.5 h-1.5 rounded-full mr-1" />
                            <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-medium">{expense.category}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Right: Amount + Actions */}
            <View className="items-end">
                <Text className="font-bold text-lg text-gray-800 dark:text-white">
                    {currency}{expense.amount.toFixed(2)}
                </Text>

                <View className="flex-row mt-1">
                    <Pressable onPress={() => setIsEditing(true)} className="p-1 mr-1">
                        <Ionicons name="pencil" size={16} color="#9ca3af" />
                    </Pressable>

                </View>
            </View>
        </View>
    );
}
