import { View, Text, Pressable, ScrollView, TextInput, Modal, Image, StyleSheet, useColorScheme as useRNColorScheme } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Audio } from 'expo-av';
import { Link, useRouter, usePathname } from "expo-router";
import { useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { ExpenseListItem } from "../components/ExpenseListItem";
import { AddExpense } from "../components/AddExpense";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useEffect } from "react";
import ExportModal from "../components/ExportModal";

import { CustomAlert } from "../components/ui/CustomAlert";

let hasShownWelcomeSession = false;

export default function Home() {
    // Hooks & State
    const { expenses } = useExpenses();
    const router = useRouter();
    const pathname = usePathname();
    const { name, categories, updateSettings, theme, isLoading: settingsLoading, isPremium, avatar: settingsAvatar } = useSettings();

    const systemScheme = useRNColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
    const [newNickname, setNewNickname] = useState("");
    const [tourStep, setTourStep] = useState(0);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [showWelcomeBack, setShowWelcomeBack] = useState(false);

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

    // Sound Logic
    const playWelcomeSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
                { shouldPlay: true, volume: 0.4 }
            );
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (e) {
            console.warn("Could not play welcome sound", e);
        }
    };

    useEffect(() => {
        if (settingsLoading) return;

        const hasName = name && name.trim() !== "";
        const hour = new Date().getHours();
        const isDND = hour >= 0 && hour < 5;

        // Only enforce nickname on Home Screen
        if (!hasName && pathname === '/') {
            if (!isNicknameModalVisible) setIsNicknameModalVisible(true);
        } else if (!isNicknameModalVisible && !showWelcomeBack && !isDND) {
            if (hasShownWelcomeSession)
                return;

            hasShownWelcomeSession = true;
            setShowWelcomeBack(true);
            playWelcomeSound();
            const timer = setTimeout(() => setShowWelcomeBack(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [name, settingsLoading, pathname]);



    const isIcon = (str: string) => str && (str.includes("-") || str === "person" || str === "person-circle" || str === "happy" || str === "glasses" || str === "woman" || str === "man" || str === "pricetag");
    const isImage = (str: string) => str && (str.startsWith('data:image') || str.startsWith('file://') || str.startsWith('http'));

    const avatar = settingsAvatar || "👤";

    const vibeData = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { title: `Good Morning, ${name}!`, vibe: "☀️ Sun's up! Record your morning coffee." };
        if (hour >= 12 && hour < 17) return { title: `Good Afternoon, ${name}!`, vibe: "🌤️ Lunch time? Track those wins." };
        if (hour >= 17 && hour < 24) return { title: `Good Evening, ${name}!`, vibe: "🌆 Winding down? Review your day." };
        return { title: `Hello, ${name}!`, vibe: "🌙 Happy Tracking!" };
    }, [name]);

    const greeting = name ? `Hello, ${name}!` : "DailyXpense";

    const orderedCategories = useMemo(() => {
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recent15 = sortedExpenses.slice(0, 15);
        const counts: Record<string, number> = {};
        recent15.forEach(e => {
            if (e.category) counts[e.category] = (counts[e.category] || 0) + 1;
        });
        return [...categories].sort((a, b) => {
            const countA = counts[a.name] || 0;
            const countB = counts[b.name] || 0;
            return countB - countA;
        });
    }, [expenses, categories]);

    const toggleCategory = (catName: string) => {
        if (catName === "All") {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(prev => {
                if (prev.includes(catName)) return [];
                return [catName];
            });
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <View style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} pointerEvents="none">
                <Image
                    source={require('../assets/images/premium_ledger_bg.jpg')}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: isDark ? 0.12 : 0.03 }}
                    resizeMode="cover"
                />
            </View>

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {showWelcomeBack && name && (
                    <Animated.View
                        entering={FadeIn.delay(500).duration(800)}
                        exiting={FadeOut.duration(500)}
                        style={{ zIndex: 100 }}
                        className="absolute top-16 left-4 right-4 items-center"
                    >
                        <View className="bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-xl shadow-lg border border-blue-500/20 backdrop-blur-md flex-row items-center">
                            <View className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-2">
                                <Text style={{ fontSize: 12 }}>{isImage(avatar) || isIcon(avatar) ? "" : avatar}</Text>
                                {isImage(avatar) && <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />}
                                {isIcon(avatar) && <Ionicons name={avatar as any} size={12} color="#2563eb" />}
                            </View>
                            <View>
                                <Text className="text-gray-900 dark:text-white font-bold text-[12px]">{vibeData.title}</Text>
                                <Text className="text-blue-600 dark:text-blue-400 font-medium text-[10px]">{vibeData.vibe}</Text>
                            </View>
                        </View>
                    </Animated.View>
                )}

                <View className="px-4">
                    <View className="flex-row justify-between items-center mb-2 pt-8">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{greeting}</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-sm">Track your expenses</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <Pressable onPress={() => setShowExportModal(true)} className="w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full items-center justify-center shadow-sm active:bg-gray-50 dark:active:bg-gray-800">
                                <Ionicons name="share-outline" size={20} color="#10b981" />
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    if (isPremium) {
                                        router.push('/dashboard');
                                    } else {
                                        showCustomAlert(
                                            "Premium Feature",
                                            "The Analytics Dashboard is available exclusively to Pro members.",
                                            "lock-closed",
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "Upgrade", style: "default", onPress: () => router.push("/settings") }
                                            ]
                                        );
                                    }
                                }}
                                className="w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full items-center justify-center shadow-sm active:bg-gray-50 dark:active:bg-gray-800"
                            >
                                <Ionicons name={isPremium ? "stats-chart" : "lock-closed"} size={16} color={isPremium ? "#3b82f6" : "#9ca3af"} />
                            </Pressable>

                            <Link href="/settings" asChild>
                                <Pressable className="w-11 h-11 bg-white dark:bg-gray-900 border-2 border-blue-100 dark:border-blue-900/30 rounded-full items-center justify-center shadow-md active:bg-gray-50 dark:active:bg-gray-800 relative">
                                    {isImage(avatar) ? (
                                        <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />
                                    ) : isIcon(avatar) ? (
                                        <View className="w-full h-full items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                            <Ionicons name={avatar as any} size={22} color="#2563eb" />
                                        </View>
                                    ) : (
                                        <Text className="text-2xl">{avatar || "👤"}</Text>
                                    )}
                                    <View className="absolute -bottom-0.5 -right-0.5 bg-blue-600 rounded-full p-1 border-2 border-white dark:border-black shadow-lg">
                                        <Ionicons name="settings" size={8} color="white" />
                                    </View>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </View>

                {/* Filters Row */}
                <View className="mb-2 px-4">
                    <View className="flex-row gap-2 mb-3">
                        <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-1.5">
                            <Ionicons name="search" size={20} color="#9ca3af" />
                            <TextInput
                                className="flex-1 ml-2 text-base text-gray-800 dark:text-white py-1"
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
                            className={`w-12 h-[42px] items-center justify-center rounded-xl border ${isFilterExpanded ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}
                        >
                            <Ionicons name={isFilterExpanded ? "grid" : "grid-outline"} size={20} color={isFilterExpanded ? "white" : "#6b7280"} />
                        </Pressable>
                    </View>

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
                                        className="flex-row items-center px-3 py-1.5 rounded-full border mb-1 mr-1"
                                        style={{
                                            backgroundColor: isSelected ? "#2563eb" : (isDark ? "#111827" : "#ffffff"),
                                            borderColor: isSelected ? "#2563eb" : (isDark ? "#1f2937" : "#e5e7eb")
                                        }}
                                    >
                                        <Ionicons name={cat.icon as any} size={12} color={isSelected ? "white" : cat.color} style={{ marginRight: 4 }} />
                                        <Text
                                            className="text-xs font-bold"
                                            style={{ color: isSelected ? "white" : (isDark ? "#d1d5db" : "#4b5563") }}
                                        >
                                            {cat.name}
                                        </Text>
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
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-1"
                                contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}
                            >
                                {orderedCategories.map((cat) => {
                                    const isSelected = selectedCategories.includes(cat.name);
                                    return (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => toggleCategory(cat.name)}
                                            className="flex-row items-center px-3 py-1.5 rounded-full border"
                                            style={{
                                                backgroundColor: isSelected ? "#2563eb" : (isDark ? "#111827" : "#ffffff"),
                                                borderColor: isSelected ? "#2563eb" : (isDark ? "#1f2937" : "#e5e7eb")
                                            }}
                                        >
                                            <Ionicons name={cat.icon as any} size={12} color={isSelected ? "white" : cat.color} style={{ marginRight: 4 }} />
                                            <Text
                                                className="text-xs font-bold"
                                                style={{ color: isSelected ? "white" : (isDark ? "#d1d5db" : "#4b5563") }}
                                            >
                                                {cat.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-20 mt-0 px-4">
                    {(() => {
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
                                <View className="bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden backdrop-blur-sm">
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

            <ExportModal
                visible={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            <Modal
                visible={isNicknameModalVisible && pathname === '/'}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View className="flex-1 justify-center items-center bg-black/80 px-4">
                    <View className="bg-white p-8 rounded-3xl w-full max-w-xs items-center shadow-xl">
                        {tourStep === 0 && (
                            <>
                                <View className="w-24 h-24 bg-white/50 rounded-2xl items-center justify-center mb-6 shadow-sm overflow-hidden border border-gray-100/50 p-2">
                                    <Image
                                        source={require('../assets/logo_premium.jpg')}
                                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                        resizeMode="contain"
                                    />
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
                                                showCustomAlert("Required", "Please enter a name", "alert-circle");
                                            }
                                        }}
                                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700 shadow-lg shadow-blue-200"
                                    >
                                        <Text className="font-bold text-white text-lg">Next</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}

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

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                buttons={alertConfig.buttons}
                onClose={closeAlert}
            />
        </View>
    );
}
