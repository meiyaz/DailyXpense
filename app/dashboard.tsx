import { View, Text, ScrollView, Pressable, useWindowDimensions, FlatList } from "react-native";
import { Stack } from "expo-router";
import { useState, useMemo } from "react";
import { useExpenses, Expense } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { BarChart } from "react-native-gifted-charts";

type Tab = "daily" | "monthly" | "annual";

import { useColorScheme } from "react-native";

export default function Dashboard() {
    const { expenses } = useExpenses();
    const { currency, categories, theme } = useSettings();
    const systemScheme = useColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    const [activeTab, setActiveTab] = useState<Tab>("daily");

    // Use state to track the selected stack index for tooltip
    const [selectedStackIndex, setSelectedStackIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const now = new Date();
        const data: any[] = [];

        // 1. Determine Time Range
        let periodStart = new Date(now);
        if (activeTab === "daily") {
            periodStart.setDate(periodStart.getDate() - 6);
            periodStart.setHours(0, 0, 0, 0);
        } else if (activeTab === "monthly") {
            periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        } else {
            periodStart = new Date(now.getFullYear() - 1, 0, 1);
        }

        // 2. Filter Expenses
        const rangeExpenses = expenses.filter(e => new Date(e.date) >= periodStart);

        // 3. Identify Top 4 Categories with Deterministic Sort
        const tagCounts: Record<string, number> = {};
        rangeExpenses.forEach(e => {
            const t = e.category || "Uncategorized";
            tagCounts[t] = (tagCounts[t] || 0) + e.amount;
        });

        // Sort by count desc, then alphabetically asc for stability
        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
            .map(entry => entry[0]);

        const topCategories = sortedTags.slice(0, 4);
        const legend = [...topCategories];
        if (sortedTags.length > 4) {
            legend.push("Others");
        }

        // Helper to get color for a tag
        const getColor = (tag: string) => {
            if (tag === "Others") return "#9ca3af";
            const cat = categories.find(c => c.name === tag);
            return cat ? cat.color : "#9ca3af";
        };

        // 4. Build Stack Helper
        const buildStacks = (subset: Expense[]) => {
            if (subset.length === 0) return [{ value: 0, color: 'transparent', frontColor: 'transparent' }];

            const bucketAmounts: Record<string, number> = {};
            legend.forEach(l => bucketAmounts[l] = 0);

            subset.forEach(e => {
                let t = e.category || "Uncategorized";
                if (!topCategories.includes(t)) t = "Others";
                bucketAmounts[t] = (bucketAmounts[t] || 0) + e.amount;
            });

            const stacks: any[] = [];
            legend.forEach((tag) => {
                const val = bucketAmounts[tag];
                if (val > 0) {
                    const color = getColor(tag);
                    stacks.push({
                        value: val,
                        color: color,
                        frontColor: color,
                        name: tag
                    });
                }
            });

            return stacks.length > 0 ? stacks : [{ value: 0, color: 'transparent', frontColor: 'transparent', name: '' }];
        };

        // 5. Generate Data Buckets
        if (activeTab === "daily") {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dStr = d.toDateString();
                const dayExpenses = rangeExpenses.filter(e => new Date(e.date).toDateString() === dStr);

                data.push({
                    label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    stacks: buildStacks(dayExpenses)
                });
            }
        } else if (activeTab === "monthly") {
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const m = d.getMonth();
                const y = d.getFullYear();
                const monthExpenses = rangeExpenses.filter(e => {
                    const ed = new Date(e.date);
                    return ed.getMonth() === m && ed.getFullYear() === y;
                });

                data.push({
                    label: d.toLocaleString('default', { month: 'short' }),
                    stacks: buildStacks(monthExpenses)
                });
            }
        } else {
            const currentYear = now.getFullYear();
            const lastYear = currentYear - 1;

            const lastYearExpenses = rangeExpenses.filter(e => new Date(e.date).getFullYear() === lastYear);
            data.push({ label: lastYear.toString(), stacks: buildStacks(lastYearExpenses) });

            const currentYearExpenses = rangeExpenses.filter(e => new Date(e.date).getFullYear() === currentYear);
            data.push({ label: currentYear.toString(), stacks: buildStacks(currentYearExpenses) });
        }

        // Return legend items with their colors
        const legendData = legend.map(tag => ({
            name: tag,
            color: getColor(tag)
        }));

        return { data, legend: legendData };
    }, [expenses, activeTab, categories]);

    const spendingByTag = useMemo(() => {
        const tags: Record<string, number> = {};
        expenses.forEach(e => {
            const t = e.category || "Uncategorized";
            tags[t] = (tags[t] || 0) + e.amount;
        });
        return Object.entries(tags)
            .sort((a, b) => b[1] - a[1]) // Sort desc
            .slice(0, 5)
            .map(([tag, amount]) => {
                const cat = categories.find(c => c.name === tag);
                return { tag, amount, color: cat ? cat.color : "#9ca3af" };
            });
    }, [expenses, categories]);

    // Calculate total from stacks
    const totalSpending = chartData.data.reduce((sum: number, item: any) => {
        const stackSum = item.stacks ? item.stacks.reduce((s: number, st: any) => s + st.value, 0) : 0;
        return sum + stackSum;
    }, 0);

    const { width: windowWidth } = useWindowDimensions();
    // Cap width at a reasonable max for desktop (e.g. 600px - padding) or use full width - padding
    const chartWidth = Math.min(windowWidth - 48, 600);

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-black">
            <Stack.Screen options={{
                title: "Dashboard",
                headerBackTitle: "Home",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: isDark ? '#000000' : '#f9fafb' },
                headerTintColor: isDark ? 'white' : 'black',
            }} />

            <View className="p-4 items-center">
                {/* Tabs */}
                <View className="flex-row bg-gray-200 dark:bg-gray-800 p-1 rounded-xl mb-6 w-full max-w-[600px]">
                    {(["daily", "monthly", "annual"] as Tab[]).map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => {
                                setActiveTab(tab);
                                setSelectedStackIndex(null); // Reset selection
                            }}
                            className={`flex-1 py-2 items-center rounded-lg ${activeTab === tab ? "bg-white dark:bg-gray-800 shadow-sm" : ""
                                }`}
                        >
                            <Text className={`capitalize font-semibold text-sm ${activeTab === tab ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                                }`}>
                                {tab}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Total Card */}
                <View className="items-center mb-8">
                    <Text className="text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">
                        Total Spending
                    </Text>
                    <Text className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        {currency}{totalSpending.toFixed(2)}
                    </Text>
                </View>

                {/* Stacked Bar Chart */}
                <View className="items-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-800 overflow-hidden pt-4 pb-4 w-full max-w-[600px]">
                    <BarChart
                        key={activeTab}
                        width={chartWidth}
                        height={220}
                        stackData={chartData.data}
                        barWidth={32}
                        spacing={30}
                        noOfSections={4}
                        yAxisThickness={0}
                        xAxisThickness={0}
                        xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
                        yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
                        initialSpacing={20}
                        rulesColor="#f3f4f6"
                        rulesType="solid"
                        isAnimated
                        // Interaction
                        onPress={(item: any, index: number) => {
                            setSelectedStackIndex(index);
                        }}
                        renderTooltip={(item: any, index: number) => {
                            return (
                                <View style={{
                                    backgroundColor: '#1f2937',
                                    padding: 8,
                                    borderRadius: 6,
                                    position: 'absolute',
                                    top: -40,
                                    left: -20,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                    zIndex: 1000,
                                }}>
                                    <View>
                                        {(item.stacks || []).slice().reverse().map((s: any, i: number) => {
                                            if (s.value === 0) return null;
                                            return (
                                                <View key={i} className="flex-row items-center mb-1">
                                                    <View style={{ width: 8, height: 8, backgroundColor: s.color, borderRadius: 4, marginRight: 6 }} />
                                                    <Text className="text-white text-xs font-medium mr-2">{s.name}:</Text>
                                                    <Text className="text-white text-xs font-bold">{currency}{s.value.toFixed(2)}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        }}
                    />

                    {/* Custom Legend */}
                    <View className="flex-row flex-wrap justify-center pb-2 px-2 gap-3 mt-4">
                        {chartData.legend.map((item) => (
                            <View key={item.name} className="flex-row items-center">
                                <View
                                    style={{ backgroundColor: item.color }}
                                    className="w-3 h-3 rounded-full mr-1.5"
                                />
                                <Text className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Tags */}
                <View className="w-full max-w-[600px]">
                    <Text className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 px-1">Top Categories</Text>
                    <View className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {spendingByTag.map((item, index) => (
                            <View key={item.tag} className={`flex-row justify-between items-center p-4 ${index !== spendingByTag.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
                                <View className="flex-row items-center">
                                    <View style={{ backgroundColor: item.color }} className="w-8 h-8 rounded-full items-center justify-center mr-3 opacity-90">
                                        <Text className="text-white font-bold">{item.tag.charAt(0)}</Text>
                                    </View>
                                    <Text className="font-semibold text-gray-700 dark:text-gray-300">{item.tag}</Text>
                                </View>
                                <Text className="font-bold text-gray-900 dark:text-white">{currency}{item.amount.toFixed(2)}</Text>
                            </View>
                        ))}
                        {spendingByTag.length === 0 && (
                            <View className="p-6 items-center">
                                <Text className="text-gray-400">No data available</Text>
                            </View>
                        )}
                    </View>
                </View>



            </View>
        </ScrollView >
    );
}
