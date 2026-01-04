import { View, Text, ScrollView, useWindowDimensions, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useExpenses, Expense } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { formatAmount } from "../lib/format";
import { useColorScheme } from "react-native";
import { BarChart, PieChart, LineChart } from "react-native-gifted-charts";
import { SmartInsights } from "../components/SmartInsights";

type Tab = "today" | "weekly" | "monthly" | "yearly";

export default function Dashboard() {
    const { expenses } = useExpenses();
    const { currency, categories, theme, locale } = useSettings();
    const systemScheme = useColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [periodOffset, setPeriodOffset] = useState(0);

    const periodLabels: Record<Tab, string> = {
        today: "Daily",
        weekly: "This Week",
        monthly: "This Month",
        yearly: "This Year"
    };

    // Chart Data Logic (Expenses Only)
    const { chartData, displayLabel } = useMemo(() => {
        const now = new Date();
        const data: any[] = [];
        let label = periodLabels[activeTab];

        // 1. Determine Time Range based on Offset
        let startDate = new Date(now);
        let endDate = new Date(now);

        if (activeTab === "today") {
            startDate.setDate(now.getDate() - periodOffset);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            if (periodOffset === 1) label = "Yesterday";
            else if (periodOffset > 1) label = startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        } else if (activeTab === "weekly") {
            // End of current period window
            endDate.setDate(now.getDate() - (periodOffset * 7));
            endDate.setHours(23, 59, 59, 999);
            // Start of current period window (7 days before end)
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);

            if (periodOffset > 0) {
                label = `${startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
            }
        } else if (activeTab === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth() - periodOffset, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            if (periodOffset > 0) {
                label = startDate.toLocaleDateString('default', { month: 'long', year: periodOffset > 11 ? 'numeric' : undefined });
            }
        } else {
            startDate = new Date(now.getFullYear() - periodOffset, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);

            if (periodOffset > 0) {
                label = startDate.getFullYear().toString();
            }
        }

        const rangeExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate && e.type !== 'income';
        });

        const getColor = (tag: string) => {
            const cat = categories.find(c => c.name === tag);
            return cat ? cat.color : "#9ca3af";
        };

        const getTotal = (subset: Expense[]) => {
            return subset.reduce((sum, e) => sum + e.amount, 0);
        };

        // 2. Build Trend Data
        if (activeTab === "today" || activeTab === "weekly") {
            const daysToShow = 7;
            const trendEndDate = new Date(endDate);
            const trendStartDate = new Date(trendEndDate);
            trendStartDate.setDate(trendEndDate.getDate() - (daysToShow - 1));

            for (let i = 0; i < daysToShow; i++) {
                const d = new Date(trendStartDate);
                d.setDate(d.getDate() + i);
                const dStr = d.toDateString();
                const subset = expenses.filter(e => new Date(e.date).toDateString() === dStr && e.type !== 'income');
                data.push({
                    label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    value: getTotal(subset),
                    frontColor: isDark ? '#60a5fa' : '#3b82f6',
                });
            }
        } else if (activeTab === "monthly") {
            const daysInMonth = endDate.getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const subset = rangeExpenses.filter(e => {
                    const ed = new Date(e.date);
                    return ed.getDate() === i && ed.getMonth() === startDate.getMonth() && ed.getFullYear() === startDate.getFullYear();
                });
                data.push({
                    label: i % 5 === 0 || i === 1 || i === daysInMonth ? `${i}` : '',
                    value: getTotal(subset),
                    frontColor: isDark ? '#60a5fa' : '#3b82f6',
                });
            }
        } else {
            // Yearly - Monthly Data
            for (let i = 0; i <= 11; i++) {
                const subset = rangeExpenses.filter(e => {
                    const ed = new Date(e.date);
                    return ed.getMonth() === i && ed.getFullYear() === startDate.getFullYear();
                });
                data.push({
                    label: new Date(0, i).toLocaleString('default', { month: 'narrow' }),
                    value: getTotal(subset),
                    frontColor: isDark ? '#60a5fa' : '#3b82f6',
                });
            }
        }

        // 3. Pie Chart Data
        const pieData: any[] = [];
        const categoryTotals: Record<string, number> = {};
        rangeExpenses.forEach(e => {
            const t = e.category || "Uncategorized";
            categoryTotals[t] = (categoryTotals[t] || 0) + e.amount;
        });

        Object.entries(categoryTotals).forEach(([name, value]) => {
            if (value > 0) {
                pieData.push({ value, color: getColor(name), name: name });
            }
        });
        pieData.sort((a, b) => b.value - a.value);

        return { chartData: { data, pieData }, displayLabel: label };
    }, [expenses, activeTab, categories, isDark, periodOffset]);

    // Financials Calculation (Updated to use same logic)
    const financials = useMemo(() => {
        const now = new Date();
        let startDate = new Date(now);
        let endDate = new Date(now);

        if (activeTab === "today") {
            startDate.setDate(now.getDate() - periodOffset);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
        } else if (activeTab === "weekly") {
            endDate.setDate(now.getDate() - (periodOffset * 7));
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        } else if (activeTab === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth() - periodOffset, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date(now.getFullYear() - periodOffset, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
        }

        const periodExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate;
        });
        const income = periodExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const expense = periodExpenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);

        return { income, expense, net: income - expense };
    }, [expenses, activeTab, periodOffset]);

    const { width: windowWidth } = useWindowDimensions();
    const chartWidth = windowWidth - 32;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: isDark ? '#000000' : '#f9fafb' },
        contentContainer: { padding: 16, alignItems: 'center' },
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#111827' : '#f3f4f6',
            borderRadius: 12,
            padding: 4,
            width: '100%',
            marginBottom: 16,
        },
        tab: {
            flex: 1,
            paddingVertical: 8,
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
            fontSize: 12,
            fontWeight: '600',
            color: isDark ? '#9ca3af' : '#6b7280',
        },
        activeTabText: {
            color: isDark ? '#60a5fa' : '#3b82f6',
            fontWeight: '700',
        },
        navigationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 16,
            paddingHorizontal: 4,
        },
        navButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDark ? '#111827' : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#1f2937' : '#e5e7eb',
        },
        navLabelContainer: {
            flex: 1,
            alignItems: 'center',
        },
        navLabel: {
            fontSize: 16,
            fontWeight: '800',
            color: isDark ? '#ffffff' : '#111827',
        },
        navSubLabel: {
            fontSize: 10,
            fontWeight: '600',
            color: isDark ? '#9ca3af' : '#6b7280',
            textTransform: 'uppercase',
            marginTop: 2,
        },
        widgetCard: { backgroundColor: isDark ? '#111827' : '#ffffff', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: isDark ? '#1f2937' : 'rgba(0,0,0,0.05)' },
        widgetLabel: { fontSize: 10, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280', textTransform: 'uppercase' },
        widgetValue: { fontSize: 24, fontWeight: '800' },
        widgetValueSmall: { fontSize: 14, fontWeight: '700' },
        chartCard: { alignItems: 'center', backgroundColor: isDark ? '#111827' : '#ffffff', borderRadius: 16, marginBottom: 12, width: '100%', paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: isDark ? '#1f2937' : '#f3f4f6' },
        placeholderContainer: { height: 160, alignItems: 'center', justifyContent: 'center' },
        placeholderText: { color: '#6b7280', marginTop: 4, fontSize: 11 }
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <SmartInsights />

            {/* Period Selection Tabs */}
            <View style={styles.tabContainer}>
                {(["today", "weekly", "monthly", "yearly"] as Tab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => {
                            setActiveTab(tab);
                            setPeriodOffset(0);
                        }}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {periodLabels[tab]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Timeline Navigation Row */}
            <View style={styles.navigationRow}>
                <TouchableOpacity
                    onPress={() => setPeriodOffset(p => p + 1)}
                    style={styles.navButton}
                >
                    <Ionicons name="chevron-back" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </TouchableOpacity>

                <View style={styles.navLabelContainer}>
                    <Text style={styles.navLabel}>{displayLabel}</Text>
                    <Text style={styles.navSubLabel}>{activeTab === 'today' ? 'Daily View' : activeTab === 'weekly' ? '7-Day View' : activeTab === 'monthly' ? 'Month View' : 'Year View'}</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setPeriodOffset(p => Math.max(0, p - 1))}
                    style={[styles.navButton, { opacity: periodOffset === 0 ? 0.3 : 1 }]}
                    disabled={periodOffset === 0}
                >
                    <Ionicons name="chevron-forward" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </TouchableOpacity>
            </View>

            {/* Ultra-Slim Overview Card */}
            <View style={[styles.widgetCard, { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 16 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.widgetLabel}>Balance</Text>
                    <Text style={[styles.widgetValue, { fontSize: 22, color: financials.net >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') }]}>
                        {currency}{formatAmount(financials.net, locale)}
                    </Text>
                </View>
                <View style={{ width: 1, height: 24, backgroundColor: isDark ? '#1f2937' : '#f3f4f6', marginHorizontal: 12 }} />
                <View style={{ flex: 1.5, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={[styles.widgetLabel, { color: isDark ? '#4ade80' : '#16a34a' }]}>In</Text>
                        <Text style={[styles.widgetValueSmall, { fontSize: 14, color: isDark ? '#4ade80' : '#16a34a' }]}>+{formatAmount(financials.income, locale)}</Text>
                    </View>
                    <View>
                        <Text style={[styles.widgetLabel, { color: isDark ? '#f87171' : '#dc2626' }]}>Out</Text>
                        <Text style={[styles.widgetValueSmall, { fontSize: 14, color: isDark ? '#f87171' : '#dc2626' }]}>-{formatAmount(financials.expense, locale)}</Text>
                    </View>
                </View>
            </View>

            {/* Activity Chart (Trends) */}
            <View style={[styles.chartCard, { paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12 }]}>
                {chartData.data.length > 0 && financials.expense > 0 ? (
                    <LineChart
                        key={`${activeTab}-${periodOffset}`}
                        areaChart
                        curved
                        data={chartData.data}
                        width={chartWidth - 85}
                        height={160}
                        spacing={activeTab === 'monthly' ? (chartWidth - 110) / 30 : (chartWidth - 130) / 6}
                        initialSpacing={10}
                        hideRules
                        yAxisColor={isDark ? '#374151' : '#e5e7eb'}
                        yAxisThickness={1}
                        yAxisTextStyle={{ color: '#9ca3af', fontSize: 8 }}
                        color={isDark ? '#60a5fa' : '#3b82f6'}
                        thickness={3}
                        startFillColor={isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)'}
                        endFillColor={isDark ? 'rgba(96, 165, 250, 0.01)' : 'rgba(59, 130, 246, 0.01)'}
                        startOpacity={0.4}
                        endOpacity={0.1}
                        noOfSections={3}
                        xAxisThickness={0}
                        hideDataPoints={activeTab === 'monthly'}
                        dataPointsColor={isDark ? '#60a5fa' : '#3b82f6'}
                        dataPointsRadius={3}
                        xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 9 }}
                        isAnimated
                    />
                ) : (
                    <View style={[styles.placeholderContainer, { height: 160 }]}>
                        <Ionicons name="pulse-outline" size={32} color="#d1d5db" />
                        <Text style={[styles.placeholderText, { fontSize: 11 }]}>No trends yet</Text>
                    </View>
                )}
            </View>

            {/* Breakdown Chart (Categories) */}
            <View style={[styles.chartCard, { paddingVertical: 12, paddingHorizontal: 12, marginBottom: 12 }]}>
                {chartData.pieData.length > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <PieChart
                            data={chartData.pieData}
                            donut
                            radius={55}
                            innerRadius={38}
                            centerLabelComponent={() => (
                                <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#fff' : '#000' }}>
                                    {currency}{Math.round(financials.expense)}
                                </Text>
                            )}
                        />
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            {chartData.pieData.slice(0, 3).map((item) => (
                                <View key={item.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />
                                        <Text style={{ color: isDark ? '#e5e7eb' : '#374151', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                                    </View>
                                    <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 11, fontWeight: '700' }}>{formatAmount(item.value, locale)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={[styles.placeholderContainer, { height: 110 }]}>
                        <Ionicons name="pie-chart-outline" size={32} color="#d1d5db" />
                        <Text style={[styles.placeholderText, { fontSize: 11 }]}>No breakdown yet</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}
