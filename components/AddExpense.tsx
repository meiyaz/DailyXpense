import { View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView, Modal, useColorScheme } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import { CategoryPicker } from "./CategoryPicker";
import { DatePicker } from "./ui/DatePicker";
import { predictCategory } from "../services/CategoryPredictor";
import { CustomAlert } from "./ui/CustomAlert";

export function AddExpense() {
    const { addExpense, expenses } = useExpenses();
    const { categories, theme, maxAmount } = useSettings();
    const systemScheme = useColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

    // Inputs
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date());
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [hasManuallySelected, setHasManuallySelected] = useState(false);
    const [type, setType] = useState<'expense' | 'income'>('expense');

    // UI State

    // UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        icon: undefined as any,
        buttons: [] as any[]
    });
    const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
    const showCustomAlert = (title: string, message: string, icon: any, buttons: any[] = [{ text: "OK" }]) => {
        setAlertConfig({ visible: true, title, message, icon, buttons });
    };

    // MRU Logic
    const getMRUCategories = () => {
        // Filter categories by selected type
        const typeCategories = categories.filter(c => (c.type || 'expense') === type);

        // Calculate frequency from expenses
        const recentExpenses = expenses.slice(0, 15);
        const frequency: Record<string, number> = {};
        recentExpenses.forEach(e => {
            frequency[e.category] = (frequency[e.category] || 0) + 1;
        });

        return [...typeCategories].sort((a, b) => {
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

    // AI Category Prediction
    useEffect(() => {
        if (!description.trim() || hasManuallySelected) return;

        const timer = setTimeout(() => {
            const predicted = predictCategory(description, categories, expenses, type);
            if (predicted && predicted !== selectedCategory) {
                setSelectedCategory(predicted);
            }
        }, 50); // Fast response for 'as-you-type' feel

        return () => clearTimeout(timer);
    }, [description, categories, expenses, type, hasManuallySelected]);

    // Reset category when type changes
    useEffect(() => {
        const typeCats = getMRUCategories();
        if (typeCats.length > 0) {
            setSelectedCategory(typeCats[0].name);
        } else {
            setSelectedCategory(undefined);
        }
    }, [type]); // Dependency on 'type'

    const handleAmountChange = (text: string) => {
        // Allow any number of digits in the input as long as it's below the maxAmount
        // and has at most 2 decimal places.
        if (/^\d*(?:\.\d{0,2})?$/.test(text)) {
            const val = parseFloat(text);
            if (isNaN(val) || val <= maxAmount) {
                setAmount(text);
            }
        }
    };

    const handleSubmit = () => {
        if (!description.trim() || !amount || !selectedCategory) {
            showCustomAlert("Missing Info", "Please fill in all fields.", "alert-circle");
            return;
        }

        addExpense({
            description: description.trim(),
            amount: parseFloat(amount),
            date: date.toISOString(),
            category: selectedCategory,
            type: type
        });

        // Reset
        setDescription("");
        setAmount("");
        setType('expense');
        setDate(new Date());
        setHasManuallySelected(false);
        setIsExpanded(false);
    };

    const categoryObj = categories.find(c => c.name === selectedCategory);
    const tag = categoryObj ? categoryObj.name : "Category";

    const inputRef = useRef<TextInput>(null);

    // Auto-focus with delay to ensure keyboard opens after Modal animation
    useEffect(() => {
        if (isExpanded) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isExpanded]);


    // Return logic...
    return (
        <>
            {/* ... FAB ... */}
            {!isExpanded && (
                <Pressable
                    onPress={() => setIsExpanded(true)}
                    className="bg-blue-600 rounded-full p-4 absolute bottom-6 right-6 shadow-lg z-50 items-center justify-center"
                >
                    <Ionicons name="add" size={32} color="white" />
                </Pressable>
            )}

            <Modal
                visible={isExpanded}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsExpanded(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <Pressable
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                        onPress={() => setIsExpanded(false)}
                    >
                        <Pressable onPress={e => e.stopPropagation()}>
                            <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-5 shadow-xl border-t border-blue-50 dark:border-gray-800">
                                {/* Header: Close Button and Type Toggle */}
                                <View className="mb-4">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-lg font-bold text-gray-800 dark:text-white">New Transaction</Text>
                                        <Pressable onPress={() => setIsExpanded(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                                            <Ionicons name="close" size={20} color="#9ca3af" />
                                        </Pressable>
                                    </View>

                                    {/* Type Toggle */}
                                    <View style={{
                                        flexDirection: 'row',
                                        backgroundColor: isDark ? '#1f2937' : '#e0e7ff',
                                        padding: 2,
                                        borderRadius: 10,
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
                                            <Text style={{ fontWeight: '700', color: type === 'expense' ? '#ef4444' : (isDark ? '#9ca3af' : '#6b7280') }}>Expense</Text>
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
                                            <Text style={{ fontWeight: '700', color: type === 'income' ? '#22c55e' : (isDark ? '#9ca3af' : '#6b7280') }}>Income</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* ROW 1: Description */}
                                <TextInput
                                    ref={inputRef}
                                    className="text-gray-900 dark:text-white font-semibold text-lg p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4"
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="What is this?"
                                    placeholderTextColor="#9ca3af"
                                    maxLength={50}
                                />

                                {/* ROW 2: Date | Amount */}
                                <View className="flex-row items-center gap-3 mb-4">
                                    <View className="flex-1">
                                        <DatePicker value={date} onChange={setDate} />
                                    </View>

                                    {/* Amount */}
                                    <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                                        <View className="flex-row items-center px-3 py-2">
                                            <TextInput
                                                className="flex-1 font-bold text-xl text-gray-900 dark:text-white text-right p-0"
                                                value={amount}
                                                onChangeText={handleAmountChange}
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>
                                        <View className="h-1 bg-gray-200 dark:bg-gray-700 w-full">
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

                                {/* ROW 3: Category | Checkmark */}
                                <View className="flex-row items-center justify-between pt-2 mb-2">
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
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 20,
                                            paddingVertical: 10,
                                            borderRadius: 12,
                                            backgroundColor: type === 'income' ? '#16a34a' : '#2563eb', // green-600 vs blue-600
                                        }}
                                    >
                                        <Text className="text-white font-bold text-sm mr-2">SAVE</Text>
                                        <Ionicons name="checkmark" size={18} color="white" />
                                    </Pressable>
                                </View>
                            </View>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
                {/* Category Picker needs to be visible ABOVE this modal if it's open, 
                    but since CategoryPicker is likely a Modal itself, it should stack fine.
                */}
                <CategoryPicker
                    visible={showCategoryPicker}
                    onClose={() => setShowCategoryPicker(false)}
                    onSelect={(cat) => {
                        setSelectedCategory(cat);
                        setHasManuallySelected(true);
                    }}
                    selectedCategory={selectedCategory}
                    customCategories={sortedCategories}
                    type={type}
                />
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                buttons={alertConfig.buttons}
                onClose={closeAlert}
            />
        </>
    );
}
