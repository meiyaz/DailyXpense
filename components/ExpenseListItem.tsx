import { View, Text, Pressable, TextInput, Alert, Animated, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Expense, useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { useState, useEffect, useRef } from "react";
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
    const { currency, categories, maxAmount, theme } = useSettings();
    const systemScheme = useColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
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
    const amountInputRef = useRef<TextInput>(null);

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
            <View className={`bg-blue-50 dark:bg-blue-900/30 p-4 border-l-4 border-l-blue-500 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                {/* Header Close */}
                <View className="flex-row justify-end items-center mb-2">
                    <Pressable onPress={() => effectiveSetIsEditing(false)}>
                        <Ionicons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                </View>

                {/* ROW 1: Description */}
                <TextInput
                    className="text-gray-900 dark:text-white font-bold text-base p-2 bg-white dark:bg-gray-800 rounded-lg mb-3 border border-gray-100 dark:border-gray-700"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description"
                    placeholderTextColor="#9ca3af"
                />

                {/* ROW 1.5: Type Toggle */}
                {/* ROW 1.5: Type Toggle */}
                {/* Improved visual                {/* ROW 1.5: Type Toggle */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: isDark ? '#1f2937' : '#e0e7ff',
                    padding: 2,
                    borderRadius: 10,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#c7d2fe'
                }}>
                    <Pressable
                        onPress={() => setType('expense')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            backgroundColor: type === 'expense' ? (isDark ? '#374151' : '#ffffff') : 'transparent',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: type === 'expense' ? 0.05 : 0,
                            shadowRadius: 2,
                            elevation: type === 'expense' ? 2 : 0,
                        }}
                    >
                        <View className="flex-row items-center gap-2">
                            {/* Optional: Add small icons to balance visual weight if text is glitchy? No, keep simple text first. */}
                            <Text style={{ fontWeight: '700', color: type === 'expense' ? '#ef4444' : (isDark ? '#9ca3af' : '#6b7280') }}>Expense</Text>
                        </View>
                    </Pressable>
                    <Pressable
                        onPress={() => setType('income')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            backgroundColor: type === 'income' ? (isDark ? '#374151' : '#ffffff') : 'transparent',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: type === 'income' ? 0.05 : 0,
                            shadowRadius: 2,
                            elevation: type === 'income' ? 2 : 0,
                        }}
                    >
                        <View className="flex-row items-center gap-2">
                            <Text style={{ fontWeight: '700', color: type === 'income' ? '#22c55e' : (isDark ? '#9ca3af' : '#6b7280') }}>Income</Text>
                        </View>
                    </Pressable>
                </View>

                {/* ROW 2: Date | Amount */}
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="flex-1">
                        <DatePicker value={date} onChange={setDate} />
                    </View>
                    <Pressable
                        onPress={() => amountInputRef.current?.focus()}
                        className="flex-1 bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700"
                    >
                        <View className="flex-row items-center justify-end px-3 py-2">
                            <TextInput
                                ref={amountInputRef}
                                className="font-bold text-base text-gray-900 dark:text-white min-w-[80px] text-right p-0"
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
                    </Pressable>
                </View>

                {/* ROW 3: Category | Actions */}
                <View className="flex-row items-center justify-between">
                    <Pressable
                        onPress={() => setCategoryPickerVisible(true)}
                        className="flex-row items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: catColor }} />
                        <Text className="text-gray-700 dark:text-gray-300 text-xs font-semibold">{selectedCategory}</Text>
                    </Pressable>

                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={handleDelete}
                            className="p-2 rounded-full bg-red-50 dark:bg-red-900/20"
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </Pressable>

                        <Pressable
                            onPress={handleSave}
                            className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30"
                        >
                            <Ionicons name="checkmark" size={20} color="#3b82f6" />
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
            </View >
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
