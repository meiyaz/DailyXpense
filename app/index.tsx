import { View, Text, Pressable, ScrollView, TextInput, Modal, Alert } from "react-native";
import { Link } from "expo-router";
import { useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import { ExpenseListItem } from "../components/ExpenseListItem";
import { AddExpense } from "../components/AddExpense";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useEffect } from "react";
import ExportModal from "../components/ExportModal";

export default function Home() {
    const { expenses } = useExpenses();
    const { name, categories, updateSettings } = useSettings();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
    const [newNickname, setNewNickname] = useState("");
    const [tourStep, setTourStep] = useState(0);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

    useEffect(() => {
        // Show modal if name is empty (First time user)
        if (!name || name.trim() === "") {
            setIsNicknameModalVisible(true);
            setTourStep(0);
        }
    }, []); // Run once on mount (or we trust name check logic) - Actually better to check on focus or specific load.
    // Ideally: if name is missing, start tour. Logic:
    useEffect(() => {
        if ((!name || name.trim() === "") && !isNicknameModalVisible) {
            setIsNicknameModalVisible(true);
        }
    }, [name]);

    const handleSaveNickname = () => {
        if (!newNickname.trim()) {
            Alert.alert("Required", "Please enter a nickname.");
            return;
        }
        updateSettings({ name: newNickname.trim() });
        setIsNicknameModalVisible(false);
    };

    // Auth Protection
    useProtectedRoute();

    const greeting = name ? `Hello, ${name}!` : "DailyXpense";

    // Sort categories by recent usage (last 15 expenses)
    const orderedCategories = useMemo(() => {
        // 1. Get recent 15 expenses
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recent15 = sortedExpenses.slice(0, 15);

        // 2. Count usage
        const counts: Record<string, number> = {};
        recent15.forEach(e => {
            if (e.category) {
                counts[e.category] = (counts[e.category] || 0) + 1;
            }
        });

        // 3. Sort categories
        return [...categories].sort((a, b) => {
            const countA = counts[a.name] || 0;
            const countB = counts[b.name] || 0;
            if (countB !== countA) return countB - countA;
            // Fallback to original order or alphabetical if needed, but stable sort is fine
            return 0;
        });
    }, [expenses, categories]);

    const toggleCategory = (catName: string) => {
        if (catName === "All") {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(prev => {
                if (prev.includes(catName)) {
                    return prev.filter(c => c !== catName);
                } else {
                    return [...prev, catName];
                }
            });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top', 'left', 'right']}>
            <View className="px-4">
                <View className="flex-row justify-between items-center mb-6 pt-8">
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{greeting}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">Track your expenses</Text>
                    </View>
                    <View className="flex-row gap-3">
                        <Pressable onPress={() => setShowExportModal(true)} className="w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full items-center justify-center shadow-sm active:bg-gray-50 dark:active:bg-gray-800">
                            <Ionicons name="share-outline" size={20} color="#10b981" />
                        </Pressable>
                        <Link href="/dashboard" asChild>
                            <Pressable className="w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full items-center justify-center shadow-sm active:bg-gray-50 dark:active:bg-gray-800">
                                <Ionicons name="stats-chart" size={20} color="#3b82f6" />
                            </Pressable>
                        </Link>
                        <Link href="/settings" asChild>
                            <Pressable className="w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full items-center justify-center shadow-sm active:bg-gray-50 dark:active:bg-gray-800">
                                <Ionicons name="settings-outline" size={20} color="#6b7280" />
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </View>

            {/* Export Modal */}
            <ExportModal
                visible={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            {/* Welcome Tour Modal */}
            <Modal
                visible={isNicknameModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View className="flex-1 justify-center items-center bg-black/80 px-4">
                    <View className="bg-white p-8 rounded-3xl w-full max-w-xs items-center shadow-xl">

                        {/* Step 0: Welcome Intro */}
                        {tourStep === 0 && (
                            <>
                                <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="sparkles" size={40} color="#2563EB" />
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome aboard!</Text>
                                <Text className="text-gray-500 mb-8 text-center leading-6">
                                    I'm your new finance assistant. Let's get you set up in seconds.
                                </Text>
                                <Pressable
                                    onPress={() => setTourStep(1)}
                                    className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    <Text className="font-bold text-white text-lg">Let's Go</Text>
                                </Pressable>
                            </>
                        )}

                        {/* Step 1: Nickname */}
                        {tourStep === 1 && (
                            <>
                                <View className="w-full">
                                    <View className="items-center mb-6">
                                        <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
                                            <Ionicons name="person" size={30} color="#9333ea" />
                                        </View>
                                        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">First things first</Text>
                                        <Text className="text-gray-500 text-center">What should we call you?</Text>
                                    </View>

                                    <TextInput
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg mb-6 text-gray-900 text-center font-bold"
                                        placeholder="Your Nickname"
                                        value={newNickname}
                                        onChangeText={setNewNickname}
                                        autoFocus
                                    />
                                    <Pressable
                                        onPress={() => {
                                            if (newNickname.trim().length > 0) {
                                                updateSettings({ name: newNickname.trim() });
                                                setTourStep(2);
                                            } else {
                                                Alert.alert("Please enter a name");
                                            }
                                        }}
                                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200"
                                    >
                                        <Text className="font-bold text-white text-lg">Next</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}

                        {/* Step 2: Pro Tip */}
                        {tourStep === 2 && (
                            <>
                                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="add" size={40} color="#059669" />
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Quick Tip</Text>
                                <Text className="text-gray-500 mb-8 text-center leading-6">
                                    Tap the <Text className="font-bold text-blue-600">+</Text> button at the bottom anytime to track a new expense instantly.
                                </Text>
                                <Pressable
                                    onPress={() => setIsNicknameModalVisible(false)}
                                    className="w-full bg-gray-900 p-4 rounded-xl items-center active:bg-gray-800 shadow-lg"
                                >
                                    <Text className="font-bold text-white text-lg">Got it!</Text>
                                </Pressable>
                            </>
                        )}

                        {/* Pagination Dots */}
                        <View className="flex-row gap-2 mt-8">
                            {[0, 1, 2].map(step => (
                                <View
                                    key={step}
                                    className={`h-2 rounded-full transition-all duration-300 ${tourStep === step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'}`}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            <View className="mb-4 px-4">
                {/* Search Bar + Filter Toggle */}
                <View className="flex-row gap-2 mb-3">
                    <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-2.5">
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-2 text-base text-gray-800 dark:text-white"
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9ca3af"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#9ca3af" />
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                        className={`w-12 items-center justify-center rounded-xl border ${isFilterExpanded ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}
                    >
                        <Ionicons name={isFilterExpanded ? "grid" : "grid-outline"} size={20} color={isFilterExpanded ? "white" : "#6b7280"} />
                    </Pressable>
                </View>

                {/* Category Filters */}
                {isFilterExpanded ? (
                    <View className="flex-row flex-wrap gap-2">
                        <Pressable
                            onPress={() => toggleCategory("All")}
                            className={`px-4 py-1.5 rounded-full border ${selectedCategories.length === 0 ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}
                        >
                            <Text className={`text-xs font-bold ${selectedCategories.length === 0 ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>All</Text>
                        </Pressable>
                        {orderedCategories.map((cat) => {
                            const isSelected = selectedCategories.includes(cat.name);
                            return (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => toggleCategory(cat.name)}
                                    className={`flex-row items-center px-3 py-1.5 rounded-full border ${isSelected ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}
                                >
                                    <Ionicons name={cat.icon as any} size={12} color={isSelected ? "white" : cat.color} style={{ marginRight: 4 }} />
                                    <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>{cat.name}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => toggleCategory("All")}
                            className={`px-4 py-1.5 rounded-full border ${selectedCategories.length === 0 ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}
                        >
                            <Text className={`text-xs font-bold ${selectedCategories.length === 0 ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>All</Text>
                        </Pressable>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 flex-row gap-2">
                            {orderedCategories.map((cat) => {
                                const isSelected = selectedCategories.includes(cat.name);
                                return (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => toggleCategory(cat.name)}
                                        className={`flex-row items-center px-3 py-1.5 rounded-full border mr-2 ${isSelected ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}
                                    >
                                        <Ionicons name={cat.icon as any} size={12} color={isSelected ? "white" : cat.color} style={{ marginRight: 4 }} />
                                        <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>{cat.name}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>



            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-20 mt-4 px-4">
                {(() => {
                    // Filtering Logic
                    const filtered = expenses.filter(e => {
                        const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(e.category);
                        return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                        return (
                            <View className="items-center justify-center py-10 opacity-50">
                                <Text className="text-gray-400 text-lg">No expenses found</Text>
                                <Text className="text-gray-400 text-sm">{expenses.length === 0 ? "Add one to get started!" : "Try adjusting your filters"}</Text>
                            </View>
                        );
                    }

                    // Group expenses by date (using filtered data)
                    const grouped: Record<string, typeof expenses> = {};
                    const sortedExpenses = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    sortedExpenses.forEach(expense => {
                        const dateObj = new Date(expense.date);
                        const currentYear = new Date().getFullYear();
                        const isDifferentYear = dateObj.getFullYear() !== currentYear;

                        const dateKey = dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: isDifferentYear ? 'numeric' : undefined
                        });
                        // Check for Today/Yesterday
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                        let displayDate = dateKey;
                        if (dateKey === today) displayDate = "Today";
                        else if (dateKey === yesterday) displayDate = "Yesterday";

                        if (!grouped[displayDate]) grouped[displayDate] = [];
                        grouped[displayDate].push(expense);
                    });

                    return Object.entries(grouped).map(([date, items]) => (
                        <View key={date} className="mb-4">
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase mb-2 ml-1 tracking-wider">{date}</Text>
                            <View className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                {items.map((expense, index) => (
                                    <ExpenseListItem
                                        key={expense.id}
                                        expense={expense}
                                        isLast={index === items.length - 1}
                                        isEditing={editingExpenseId === expense.id}
                                        onEditStart={() => setEditingExpenseId(expense.id)}
                                        onEditEnd={() => setEditingExpenseId(null)}
                                    />
                                ))}
                            </View>
                        </View>
                    ));
                })()}
                <View className="h-10" />
            </ScrollView>
            <AddExpense />
        </SafeAreaView>
    );
}
