import { View, Text, Pressable, TextInput, Alert, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Expense, useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { useState, useEffect } from "react";
import { DatePicker } from "./ui/DatePicker";
import { CategoryPicker } from "./CategoryPicker";
import { formatAmount } from "../lib/format";
import { predictCategory } from "../services/CategoryPredictor";

interface ExpenseListItemProps {
    expense: Expense;
    isLast?: boolean;
    isEditing?: boolean;
    onEditStart?: () => void;
    onEditEnd?: () => void;
}

export function ExpenseListItem({ expense, isLast, isEditing = false, onEditStart, onEditEnd }: ExpenseListItemProps) {
    const { deleteExpense, updateExpense } = useExpenses();
    const { currency, categories, maxAmount } = useSettings();
    // Removed local isEditing state, relying on props or internal handle if optional.
    // However, to support parent control, we use the prop. 
    // If not provided (legacy), we could have fallback, but we updated parent.

    // We assume if props are provided, we use them.
    const [localIsEditing, setLocalIsEditing] = useState(false);

    const effectiveIsEditing = onEditStart ? isEditing : localIsEditing;
    const effectiveSetIsEditing = (val: boolean) => {
        if (onEditStart && onEditEnd) {
            if (val) onEditStart();
            else onEditEnd();
        } else {
            setLocalIsEditing(val);
        }
    };

    // Edit State
    const [description, setDescription] = useState(expense.description);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [date, setDate] = useState(new Date(expense.date));
    const [selectedCategory, setSelectedCategory] = useState(expense.category);
    const [hasManuallySelected, setHasManuallySelected] = useState(false);
    const [type, setType] = useState<'expense' | 'income'>(expense.type || 'expense');

    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

    // Reset category when type changes
    useEffect(() => {
        if (!effectiveIsEditing) return;

        const currentCat = categories.find(c => c.name === selectedCategory);
        if (currentCat && currentCat.type === type) return;

        // Find first valid category for new type
        const validCats = categories.filter(c => c.type === type);
        if (validCats.length > 0) {
            setSelectedCategory(validCats[0].name);
        }
    }, [type, effectiveIsEditing]);

    // AI Category Prediction (Instant feel)
    const { expenses } = useExpenses();
    useEffect(() => {
        if (!effectiveIsEditing || !description.trim() || hasManuallySelected) return;

        const timer = setTimeout(() => {
            const predicted = predictCategory(description, categories, expenses, type);
            if (predicted && predicted !== selectedCategory) {
                setSelectedCategory(predicted);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [description, categories, expenses, type, effectiveIsEditing, hasManuallySelected]);

    const categoryObj = categories.find(c => c.name === (effectiveIsEditing ? selectedCategory : expense.category));
    const catColor = categoryObj ? categoryObj.color : "#9ca3af";
    const catIcon: any = categoryObj ? categoryObj.icon : "pricetag";

    const handleDelete = () => {
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    deleteExpense(expense.id);
                    // effectiveSetIsEditing(false); // No need, item unmounts
                }
            }
        ]);
    };

    const handleSave = () => {
        if (!description.trim() || !amount) return;
        updateExpense(expense.id, {
            description: description.trim(),
            amount: parseFloat(amount),
            date: date.toISOString(),
            category: selectedCategory,
            type: type
        });
        effectiveSetIsEditing(false);
    };

    const handleAmountChange = (text: string) => {
        if (/^\d*(?:\.\d{0,2})?$/.test(text)) {
            const val = parseFloat(text);
            if (isNaN(val) || val <= maxAmount) {
                setAmount(text);
            }
        }
    };

    if (effectiveIsEditing) {
        return (
            <View className={`bg-blue-50/50 p-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                {/* Header Close */}
                <View className="flex-row justify-end items-center mb-2">
                    <Pressable onPress={() => effectiveSetIsEditing(false)}>
                        <Ionicons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                </View>

                {/* ROW 1: Description */}
                <TextInput
                    className="text-gray-900 font-bold text-base p-2 bg-white rounded-lg mb-3"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description"
                />

                {/* ROW 1.5: Type Toggle */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <Pressable
                        onPress={() => setType('expense')}
                        style={{
                            flex: 1,
                            paddingVertical: 6,
                            alignItems: 'center',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: type === 'expense' ? '#fecaca' : '#e5e7eb',
                            backgroundColor: type === 'expense' ? '#fef2f2' : '#f9fafb',
                        }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: type === 'expense' ? '#ef4444' : '#9ca3af' }}>EXPENSE</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setType('income')}
                        style={{
                            flex: 1,
                            paddingVertical: 6,
                            alignItems: 'center',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: type === 'income' ? '#bbf7d0' : '#e5e7eb',
                            backgroundColor: type === 'income' ? '#f0fdf4' : '#f9fafb',
                        }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: type === 'income' ? '#22c55e' : '#9ca3af' }}>INCOME</Text>
                    </Pressable>
                </View>

                {/* ROW 2: Date | Amount */}
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="flex-1">
                        <DatePicker value={date} onChange={setDate} />
                    </View>
                    <View className="flex-1 bg-white rounded-lg overflow-hidden">
                        <View className="flex-row items-center justify-end px-2 py-2">
                            <Text className="font-bold mr-1 text-base text-gray-400">
                            </Text>
                            <TextInput
                                className="font-bold text-lg text-gray-900 min-w-[50px] text-right p-0"
                                value={amount}
                                onChangeText={handleAmountChange}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="h-1 bg-gray-100 w-full">
                            <View
                                style={{
                                    width: `${Math.min((parseFloat(amount) || 0) / maxAmount * 100, 100)}%`,
                                    backgroundColor: (parseFloat(amount) || 0) > maxAmount * 0.9 ? '#ef4444' : '#3b82f6',
                                    height: '100%'
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* ROW 3: Category | Actions */}
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
                    onSelect={(cat) => {
                        setSelectedCategory(cat);
                        setHasManuallySelected(true);
                    }}
                    selectedCategory={selectedCategory}
                    type={type}
                />
            </View>
        );
    }

    // View Mode Layout
    return (
        <Pressable
            onPress={() => effectiveSetIsEditing(true)}
            className={`flex-row items-center justify-between p-4 bg-white dark:bg-gray-900 active:bg-gray-50 dark:active:bg-gray-800 ${!isLast ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
        >
            {/* Left: Icon + Info */}
            <View className="flex-row items-center flex-1 mr-4">
                {/* Icon Background */}
                <View
                    style={{ backgroundColor: `${catColor}15` }}
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


            {/* Right: Amount */}
            <View className="items-end">
                <Text className={`font-bold text-lg ${expense.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-gray-800 dark:text-white'}`}>
                    {expense.type === 'income' ? '+' : ''}{formatAmount(expense.amount)}
                </Text>
            </View>
        </Pressable>
    );
}
