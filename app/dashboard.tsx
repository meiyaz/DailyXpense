import { View, Text, ScrollView, useWindowDimensions, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useExpenses, Expense } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { formatAmount } from "../lib/format";
import { useColorScheme } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { SmartInsights } from "../components/SmartInsights";

type Tab = "today" | "weekly" | "monthly" | "yearly";

export default function Dashboard() {
    const { expenses } = useExpenses();
    const { currency, categories, theme, locale } = useSettings();
    const systemScheme = useColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [periodOffset, setPeriodOffset] = useState(0);
    const [chartType, setChartType] = useState<"trend" | "category">("trend");

    const periodLabels: Record<Tab, string> = {
        today: "Today",
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

        // 2. Build Bar Data
        if (activeTab === "today") {
            const timeSlots = [
                { label: '4am', start: 0, end: 4 },
                { label: '8am', start: 4, end: 8 },
                { label: '12pm', start: 8, end: 12 },
                { label: '4pm', start: 12, end: 16 },
                { label: '8pm', start: 16, end: 20 },
                { label: '12am', start: 20, end: 24 },
            ];
            timeSlots.forEach(slot => {
                const subset = rangeExpenses.filter(e => {
                    const h = new Date(e.date).getHours();
                    return h >= slot.start && h < slot.end;
                });
                data.push({
                    label: slot.label,
                    value: getTotal(subset),
                    frontColor: isDark ? '#60a5fa' : '#3b82f6',
                });
            });
        } else if (activeTab === "weekly") {
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const dStr = d.toDateString();
                const subset = rangeExpenses.filter(e => new Date(e.date).toDateString() === dStr);
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
    const chartWidth = Math.min(windowWidth - 48, 600);

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: isDark ? '#000000' : '#f9fafb' },
        contentContainer: { padding: 16, alignItems: 'center' },
        dropdownTrigger: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 16,
            width: '100%',
            maxWidth: 600,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? '#1f2937' : '#e5e7eb',
        },
        triggerText: { fontSize: 16, fontWeight: '700', color: isDark ? '#ffffff' : '#111827' },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: isDark ? '#111827' : '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
        modalTitle: { fontSize: 20, fontWeight: '800', color: isDark ? '#ffffff' : '#111827', marginBottom: 20, textAlign: 'center' },
        option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 },
        activeOption: { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' },
        optionText: { fontSize: 16, fontWeight: '600', color: isDark ? '#9ca3af' : '#4b5563' },
        activeOptionText: { color: '#3b82f6', fontWeight: '700' },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: 600,
            marginBottom: 16,
        },
        sectionTitle: { fontSize: 18, fontWeight: '700', color: isDark ? '#f3f4f6' : '#1f2937' },
        compactTrigger: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? '#1f2937' : '#e5e7eb',
            gap: 6,
        },
        compactTriggerText: { fontSize: 12, fontWeight: '700', color: isDark ? '#60a5fa' : '#3b82f6' },
        widgetCard: { backgroundColor: isDark ? '#111827' : '#ffffff', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: isDark ? '#1f2937' : 'rgba(0,0,0,0.05)' },
        widgetLabel: { fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280', textTransform: 'uppercase' },
        widgetValue: { fontSize: 24, fontWeight: '800' },
        widgetValueSmall: { fontSize: 16, fontWeight: '700' },
        chartToggleContainer: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
            width: '100%',
        },
        chartToggleButton: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
            borderRadius: 8,
        },
        activeChartToggleButton: {
            backgroundColor: isDark ? '#374151' : '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        chartToggleText: {
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? '#9ca3af' : '#6b7280',
        },
        activeChartToggleText: {
            color: isDark ? '#ffffff' : '#111827',
        },
        chartCard: { alignItems: 'center', backgroundColor: isDark ? '#111827' : '#ffffff', borderRadius: 16, marginBottom: 24, width: '100%', maxWidth: 600, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: isDark ? '#1f2937' : '#f3f4f6' },
        placeholderContainer: { height: 200, alignItems: 'center', justifyContent: 'center' },
        placeholderText: { color: '#6b7280', marginTop: 8 }
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <SmartInsights />

            {/* Overview Section Header with Integrated Dropdown & Navigation */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setPeriodOffset(p => p + 1)} style={{ padding: 4 }}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#6b7280' : '#9ca3af'} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.compactTrigger, { flex: 1, marginHorizontal: 8, justifyContent: 'center' }]}
                    onPress={() => setIsDropdownOpen(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="calendar-outline" size={14} color={isDark ? '#60a5fa' : '#3b82f6'} />
                    <Text style={styles.compactTriggerText} numberOfLines={1}>{displayLabel}</Text>
                    <Ionicons name="chevron-down" size={12} color={isDark ? '#6b7280' : '#9ca3af'} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setPeriodOffset(p => Math.max(0, p - 1))}
                    style={{ padding: 4, opacity: periodOffset === 0 ? 0.3 : 1 }}
                    disabled={periodOffset === 0}
                >
                    <Ionicons name="chevron-forward" size={24} color={isDark ? '#6b7280' : '#9ca3af'} />
                </TouchableOpacity>
            </View>

            <Modal visible={isDropdownOpen} transparent animationType="slide" onRequestClose={() => setIsDropdownOpen(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setIsDropdownOpen(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Period</Text>
                        {(["today", "weekly", "monthly", "yearly"] as Tab[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.option, activeTab === tab && styles.activeOption]}
                                onPress={() => {
                                    setActiveTab(tab);
                                    setPeriodOffset(0); // Reset offset when changing range type
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <Text style={[styles.optionText, activeTab === tab && styles.activeOptionText]}>{periodLabels[tab]}</Text>
                                {activeTab === tab && <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            {/* Consolidated Overview Card */}
            <View style={[styles.widgetCard, { width: '100%', maxWidth: 600 }]}>
                {/* Net Balance (Top Section) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.widgetLabel}>Net Balance</Text>
                        <Text style={[styles.widgetValue, { color: financials.net >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626'), marginTop: 4 }]}>
                            {currency}{formatAmount(financials.net, locale)}
                        </Text>
                    </View>
                    <View style={{ padding: 12, backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : '#dcfce7', borderRadius: 16 }}>
                        <Ionicons name="wallet" size={24} color={isDark ? '#4ade80' : '#16a34a'} />
                    </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: isDark ? '#1f2937' : '#f3f4f6', marginBottom: 20 }} />

                {/* Income & Expense Row (Bottom Section) */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="arrow-down-circle" size={16} color={isDark ? '#4ade80' : '#16a34a'} />
                            <Text style={styles.widgetLabel}>Income</Text>
                        </View>
                        <Text style={[styles.widgetValueSmall, { color: isDark ? '#4ade80' : '#16a34a' }]}>
                            +{currency}{formatAmount(financials.income, locale)}
                        </Text>
                    </View>

                    <View style={{ width: 1, backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }} />

                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="arrow-up-circle" size={16} color={isDark ? '#f87171' : '#dc2626'} />
                            <Text style={styles.widgetLabel}>Expense</Text>
                        </View>
                        <Text style={[styles.widgetValueSmall, { color: isDark ? '#f87171' : '#dc2626' }]}>
                            -{currency}{formatAmount(financials.expense, locale)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* VisualsCard: Trends & Breakdown Toggle */}
            <View style={styles.chartCard}>
                <View style={styles.chartToggleContainer}>
                    <TouchableOpacity
                        style={[styles.chartToggleButton, chartType === 'trend' && styles.activeChartToggleButton]}
                        onPress={() => setChartType('trend')}
                    >
                        <Text style={[styles.chartToggleText, chartType === 'trend' && styles.activeChartToggleText]}>Activity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chartToggleButton, chartType === 'category' && styles.activeChartToggleButton]}
                        onPress={() => setChartType('category')}
                    >
                        <Text style={[styles.chartToggleText, chartType === 'category' && styles.activeChartToggleText]}>Breakdown</Text>
                    </TouchableOpacity>
                </View>

                {chartType === 'trend' ? (
                    chartData.data.length > 0 && financials.expense > 0 ? (
                        <BarChart
                            key={`${activeTab}-${periodOffset}`}
                            width={chartWidth - 80}
                            height={180}
                            data={chartData.data}
                            barWidth={activeTab === 'monthly' ? 6 : activeTab === 'weekly' ? 24 : activeTab === 'today' ? 30 : 12}
                            spacing={activeTab === 'monthly' ? 2 : activeTab === 'weekly' ? 18 : activeTab === 'today' ? 25 : 8}
                            noOfSections={4}
                            yAxisThickness={0}
                            xAxisThickness={0}
                            xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                            yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                            isAnimated
                            frontColor={isDark ? '#60a5fa' : '#3b82f6'}
                            barBorderRadius={2}
                            initialSpacing={6}
                        />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
                            <Text style={styles.placeholderText}>No data for this period</Text>
                        </View>
                    )
                ) : (
                    chartData.pieData.length > 0 ? (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                            <PieChart
                                data={chartData.pieData}
                                donut
                                radius={100}
                                innerRadius={70}
                                centerLabelComponent={() => (
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>Total</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#fff' : '#000' }}>{currency}{Math.round(financials.expense)}</Text>
                                    </View>
                                )}
                            />
                            <View style={{ width: '100%', marginTop: 16 }}>
                                {chartData.pieData.slice(0, 5).map((item, idx) => (
                                    <View key={item.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx === Math.min(chartData.pieData.length, 5) - 1 ? 0 : 1, borderBottomColor: isDark ? '#1f2937' : '#f3f4f6' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                                            <Text style={{ color: isDark ? '#e5e7eb' : '#374151', fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                                        </View>
                                        <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 13, fontWeight: '700' }}>{currency}{Math.round(item.value).toLocaleString()}</Text>
                                    </View>
                                ))}
                                {chartData.pieData.length > 5 && (
                                    <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 8 }}>+ {chartData.pieData.length - 5} more categories</Text>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
                            <Text style={styles.placeholderText}>No expenses to show</Text>
                        </View>
                    )
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}
