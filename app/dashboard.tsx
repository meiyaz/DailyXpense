import { View, Text, ScrollView, useWindowDimensions, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { useExpenses, Expense } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { formatAmount } from "../lib/format";
import { useColorScheme } from "react-native";
import { BarChart } from "react-native-gifted-charts";

type Tab = "daily" | "monthly" | "annual";

export default function Dashboard() {
    const { expenses } = useExpenses();
    const { currency, categories, theme, locale } = useSettings();
    const systemScheme = useColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    const [activeTab, setActiveTab] = useState<Tab>("daily");

    // Chart Data Logic (Expenses Only)
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

        // 2. Filter Expenses (Type = Expense only for Chart)
        const rangeExpenses = expenses.filter(e =>
            new Date(e.date) >= periodStart && e.type !== 'income'
        );

        // 3. Identify Top 4 Categories
        const tagCounts: Record<string, number> = {};
        rangeExpenses.forEach(e => {
            const t = e.category || "Uncategorized";
            tagCounts[t] = (tagCounts[t] || 0) + e.amount;
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
            .map(entry => entry[0]);

        const topCategories = sortedTags.slice(0, 4);
        const legend = [...topCategories];
        if (sortedTags.length > 4) legend.push("Others");

        const getColor = (tag: string) => {
            if (tag === "Others") return "#9ca3af";
            const cat = categories.find(c => c.name === tag);
            return cat ? cat.color : "#9ca3af";
        };

        const buildStacks = (subset: Expense[]) => {
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
                stacks.push({
                    value: val,
                    color: getColor(tag),
                    name: tag,
                    marginBottom: val > 0 ? 1 : 0,
                });
            });
            return stacks;
        };

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

        const legendData = legend.map(tag => ({ name: tag, color: getColor(tag) }));
        return { data, legend: legendData };
    }, [expenses, activeTab, categories]);

    // Financials Calculation (Income vs Expense)
    const financials = useMemo(() => {
        const now = new Date();
        let periodStart = new Date(now);

        if (activeTab === "daily") {
            periodStart.setDate(periodStart.getDate() - 6);
            periodStart.setHours(0, 0, 0, 0);
        } else if (activeTab === "monthly") {
            periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        } else {
            periodStart = new Date(now.getFullYear() - 1, 0, 1);
        }

        const periodExpenses = expenses.filter(e => new Date(e.date) >= periodStart);

        const income = periodExpenses
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + e.amount, 0);

        const expense = periodExpenses
            .filter(e => e.type !== 'income')
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            income,
            expense,
            net: income - expense
        };
    }, [expenses, activeTab]);

    const { width: windowWidth } = useWindowDimensions();
    const chartWidth = Math.min(windowWidth - 48, 600);



    const styles = StyleSheet.create({
        // ... existing styles ...
        container: {
            flex: 1,
            backgroundColor: isDark ? '#000000' : '#f9fafb',
        },
        contentContainer: {
            padding: 16,
            alignItems: 'center',
        },
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#1f2937' : '#e5e7eb',
            borderRadius: 12,
            marginBottom: 24,
            width: '100%',
            maxWidth: 600,
            padding: 4,
        },
        tab: {
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 8,
        },
        activeTab: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            textTransform: 'capitalize',
            color: isDark ? '#9ca3af' : '#6b7280',
        },
        activeTabText: {
            color: isDark ? '#ffffff' : '#111827',
        },
        totalLabel: {
            fontSize: 12,
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 4,
        },
        totalAmount: {
            fontSize: 36,
            fontWeight: '800',
            color: isDark ? '#ffffff' : '#111827',
        },
        chartCard: {
            alignItems: 'center',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderRadius: 16,
            marginBottom: 24,
            width: '100%',
            maxWidth: 600,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: isDark ? '#1f2937' : '#f3f4f6',
            overflow: 'hidden',
        },
        placeholderContainer: {
            height: 220,
            alignItems: 'center',
            justifyContent: 'center',
        },
        placeholderText: {
            color: '#6b7280',
        },
        legendContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 16,
            paddingHorizontal: 8,
            gap: 12,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        legendDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginRight: 6,
        },
        legendText: {
            fontSize: 12,
            fontWeight: '500',
            color: isDark ? '#9ca3af' : '#4b5563',
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#f3f4f6' : '#1f2937',
            marginBottom: 12,
            paddingHorizontal: 4,
        },
        listCard: {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderRadius: 16,
            width: '100%',
            borderWidth: 1,
            borderColor: isDark ? '#1f2937' : '#f3f4f6',
            overflow: 'hidden',
        },
        listItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
        },
        listItemBorder: {
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#1f2937' : '#f9fafb',
        },
        categoryIcon: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            opacity: 0.9,
        },
        categoryIconText: {
            color: '#ffffff',
            fontWeight: '700',
        },
        categoryName: {
            fontWeight: '600',
            color: isDark ? '#d1d5db' : '#374151',
        },
        categoryAmount: {
            fontWeight: '700',
            color: isDark ? '#ffffff' : '#111827',
        }
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {(["daily", "monthly", "annual"] as Tab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Total Card */}
            <View style={{ alignItems: 'center', marginBottom: 24, paddingHorizontal: 16 }}>
                {/* Net Balance */}
                <Text style={styles.totalLabel}>
                    Net {activeTab} Balance
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '800', color: financials.net >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') }}>
                    {currency}{formatAmount(financials.net, locale)}
                </Text>

                {/* Grid for Income / Expense */}
                <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, textTransform: 'uppercase', color: '#6b7280', fontWeight: '600' }}>Income</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#4ade80' : '#16a34a' }}>
                            +{currency}{formatAmount(financials.income, locale)}
                        </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, textTransform: 'uppercase', color: '#6b7280', fontWeight: '600' }}>Expense</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#f87171' : '#dc2626' }}>
                            -{currency}{formatAmount(financials.expense, locale)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
                {financials.expense > 0 ? (
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
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No expenses in this period</Text>
                    </View>
                )}

                {/* Legend */}
                <View style={styles.legendContainer}>
                    {chartData.legend.map((item) => (
                        <View key={item.name} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
