import { View, Text, ScrollView, useWindowDimensions, StyleSheet, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, useColorScheme as useRNColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useExpenses } from "../store/ExpenseContext";
import { useSettings } from "../store/SettingsContext";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { useRouter } from "expo-router";
import { formatAmount } from "../lib/format";
import { BlurView } from "expo-blur";
import { SmartInsights } from "../components/SmartInsights";

type Tab = "today" | "weekly" | "monthly" | "yearly";

export default function Dashboard() {
    const { expenses } = useExpenses();
    const { categories, locale, currency, theme, isPremium } = useSettings();
    const systemColorScheme = useRNColorScheme();
    const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();

    const [activeTab, setActiveTab] = useState<Tab>("weekly");
    const [periodOffset, setPeriodOffset] = useState(0);
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);

    const periodLabels: Record<Tab, string> = {
        today: "Today",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly"
    };

    // Financial calculations
    const { financials, chartData, displayLabel } = useMemo(() => {
        const now = new Date();
        let startDate = new Date(now);
        let endDate = new Date(now);
        let label = periodLabels[activeTab];

        if (activeTab === "today") {
            startDate.setDate(now.getDate() - periodOffset);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            if (periodOffset === 0) label = "Today";
            else if (periodOffset === 1) label = "Yesterday";
            else label = startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
        } else if (activeTab === "weekly") {
            endDate.setDate(now.getDate() - (periodOffset * 7));
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            label = `${startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`;
        } else if (activeTab === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth() - periodOffset, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            label = startDate.toLocaleDateString(locale, { month: 'long', year: periodOffset > 11 ? 'numeric' : undefined });
        } else {
            startDate = new Date(now.getFullYear() - periodOffset, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            label = startDate.getFullYear().toString();
        }

        const periodExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate;
        });

        const income = periodExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const expense = periodExpenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);

        // Trend Data
        const trendData: any[] = [];
        if (activeTab === "today" || activeTab === "weekly") {
            const daysToShow = 7;
            for (let i = 0; i < daysToShow; i++) {
                const d = new Date(endDate);
                d.setDate(d.getDate() - (daysToShow - 1 - i));
                const dStr = d.toDateString();
                const dayTotal = expenses.filter(e => new Date(e.date).toDateString() === dStr && e.type !== 'income')
                    .reduce((sum, e) => sum + e.amount, 0);
                trendData.push({
                    label: d.toLocaleDateString(locale, { weekday: 'narrow' }),
                    value: dayTotal,
                });
            }
        } else if (activeTab === "monthly") {
            const year = startDate.getFullYear();
            const month = startDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const weeks = Math.ceil(daysInMonth / 7);
            for (let i = 0; i < weeks; i++) {
                const wStart = new Date(year, month, i * 7 + 1);
                const wEnd = new Date(year, month, (i + 1) * 7);
                if (wEnd > endDate) wEnd.setHours(23, 59, 59, 999);
                const weekTotal = expenses.filter(e => {
                    const d = new Date(e.date);
                    return d >= wStart && d <= wEnd && e.type !== 'income';
                }).reduce((sum, e) => sum + e.amount, 0);
                trendData.push({ label: `W${i + 1}`, value: weekTotal });
            }
        } else {
            const year = startDate.getFullYear();
            for (let m = 0; m < 12; m++) {
                const mStart = new Date(year, m, 1);
                const mEnd = new Date(year, m + 1, 0, 23, 59, 59, 999);
                const monthTotal = expenses.filter(e => {
                    const d = new Date(e.date);
                    return d >= mStart && d <= mEnd && e.type !== 'income';
                }).reduce((sum, e) => sum + e.amount, 0);
                trendData.push({ label: mStart.toLocaleDateString(locale, { month: 'short' }).substring(0, 2), value: monthTotal });
            }
        }

        // Pie Data
        const categoryMap: Record<string, number> = {};
        periodExpenses.filter(e => e.type !== 'income').forEach(e => {
            const cat = e.category || "Other";
            categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
        });
        const pieData = Object.entries(categoryMap).map(([name, value]) => ({
            value,
            color: categories.find(c => c.name === name)?.color || "#94a3b8",
            name
        })).sort((a, b) => b.value - a.value);

        return {
            financials: { income, expense, net: income - expense },
            chartData: { trendData, pieData },
            displayLabel: label
        };
    }, [expenses, activeTab, periodOffset, categories, locale]);

    const styles = createStyles(isDark, windowWidth);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#1e293b'} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Spend Review</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* 1. Unified Timeline Controller */}
                <View style={styles.timelineController}>
                    <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowPeriodPicker(true)}>
                        <Text style={styles.dropdownText}>{periodLabels[activeTab]}</Text>
                        <Ionicons name="chevron-down" size={12} color="#3b82f6" />
                    </TouchableOpacity>

                    <View style={styles.navVDivider} />

                    <View style={styles.dateNavigator}>
                        <TouchableOpacity onPress={() => setPeriodOffset(p => p + 1)} style={styles.navActionBtn}>
                            <Ionicons name="chevron-back" size={16} color={isDark ? '#fff' : '#1e293b'} />
                        </TouchableOpacity>

                        <View style={styles.dateLabelContainer}>
                            <Text style={styles.dateMainLabel} numberOfLines={1}>{displayLabel}</Text>
                            <Text style={styles.dateSubLabel}>{activeTab.toUpperCase()}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setPeriodOffset(p => Math.max(0, p - 1))}
                            style={[styles.navActionBtn, periodOffset === 0 && { opacity: 0.1 }]}
                            disabled={periodOffset === 0}
                        >
                            <Ionicons name="chevron-forward" size={16} color={isDark ? '#fff' : '#1e293b'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Period Selection Modal */}
                <Modal visible={showPeriodPicker} transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setShowPeriodPicker(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.pickerCard}>
                                {(["today", "weekly", "monthly", "yearly"] as Tab[]).map((tab) => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.pickerItem, activeTab === tab && styles.pickerItemActive]}
                                        onPress={() => {
                                            setActiveTab(tab);
                                            setPeriodOffset(0);
                                            setShowPeriodPicker(false);
                                        }}
                                    >
                                        <View style={styles.pickerItemContent}>
                                            <Text style={[styles.pickerItemText, activeTab === tab && styles.pickerItemTextActive]}>
                                                {periodLabels[tab]}
                                            </Text>
                                            {activeTab === tab && <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* 3. Compact Primary Metrics Card */}
                <View style={styles.compactCard}>
                    <View style={styles.compactTopRow}>
                        <View>
                            <Text style={styles.compactLabel}>Total Balance</Text>
                            <Text style={[styles.compactBalance, { color: financials.net >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') }]}>
                                {currency}{formatAmount(Math.abs(financials.net), locale)}
                            </Text>
                        </View>
                        <LinearGradient
                            colors={isDark ? ['#1e3a8a', '#1e40af'] : ['#3b82f6', '#2563eb']}
                            style={styles.compactIconBg}
                        >
                            <Ionicons name="wallet" size={20} color="#fff" />
                        </LinearGradient>
                    </View>

                    <View style={styles.compactStatsRow}>
                        <View style={styles.compactStatItem}>
                            <Ionicons name="arrow-up" size={14} color="#4ade80" />
                            <Text style={styles.compactStatValue}>+{formatAmount(financials.income, locale)}</Text>
                        </View>
                        <View style={styles.compactVDivider} />
                        <View style={styles.compactStatItem}>
                            <Ionicons name="arrow-down" size={14} color="#f87171" />
                            <Text style={styles.compactStatValue}>-{formatAmount(financials.expense, locale)}</Text>
                        </View>
                    </View>
                </View>



                {/* 4. Spend Review Pro Section (Gated) */}
                <View style={styles.proSectionContainer}>
                    <View style={{ opacity: isPremium ? 1 : 0.5 }} pointerEvents={isPremium ? 'auto' : 'none'}>
                        {/* Charts */}
                        <View style={styles.chartsGrid}>
                            <View style={styles.chartCard}>
                                <View style={styles.chartHeader}>
                                    <Text style={styles.chartTitle}>Spending Activity</Text>
                                </View>
                                {financials.expense > 0 ? (
                                    <LineChart
                                        areaChart
                                        curved
                                        data={chartData.trendData}
                                        width={windowWidth - 122}
                                        height={160}
                                        spacing={(windowWidth - 140) / Math.max(1, chartData.trendData.length - 1)}
                                        initialSpacing={15}
                                        color="#3b82f6"
                                        thickness={4}
                                        startFillColor="rgba(59, 130, 246, 0.25)"
                                        endFillColor="rgba(59, 130, 246, 0)"
                                        dataPointsColor="#3b82f6"
                                        dataPointsRadius={4}
                                        pointerConfig={{
                                            pointerStripColor: '#3b82f6',
                                            pointerColor: '#3b82f6',
                                            radius: 6,
                                            pointerLabelComponent: (items: any) => (
                                                <View style={styles.pointerLabel}>
                                                    <Text style={styles.pointerText}>
                                                        {currency}{formatAmount(items[0].value, locale)}
                                                    </Text>
                                                </View>
                                            ),
                                        }}
                                        rulesType="solid"
                                        rulesColor={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                                        yAxisColor="transparent"
                                        xAxisColor="transparent"
                                        yAxisTextStyle={styles.axisText}
                                        xAxisLabelTextStyle={styles.axisText}
                                        yAxisLabelWidth={30}
                                        formatYLabel={(label: string) => {
                                            const val = parseFloat(label);
                                            if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
                                            return label;
                                        }}
                                    />
                                ) : (
                                    <View style={styles.emptyView}>
                                        <Ionicons name="analytics" size={32} color="#94a3b8" opacity={0.3} />
                                        <Text style={styles.emptyText}>Activity will appear here</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.chartCard}>
                                <View style={styles.chartHeader}>
                                    <Text style={styles.chartTitle}>Category Mix</Text>
                                </View>
                                {chartData.pieData.length > 0 ? (
                                    <View style={styles.pieContainer}>
                                        <PieChart
                                            donut
                                            radius={65}
                                            innerRadius={50}
                                            data={chartData.pieData}
                                            centerLabelComponent={() => (
                                                <Text style={{ fontSize: 12, fontWeight: '900', color: isDark ? '#fff' : '#1e293b' }}>
                                                    {Math.round((financials.expense / (financials.income || financials.expense || 1)) * 100)}%
                                                </Text>
                                            )}
                                        />
                                        <View style={styles.pieLegend}>
                                            {chartData.pieData.slice(0, 3).map((item, idx) => (
                                                <View key={idx} style={styles.legendRow}>
                                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                                    <Text style={styles.legendName} numberOfLines={1}>{item.name}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.emptyView}>
                                        <Text style={styles.emptyText}>Categorize your spending</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Pro Gating Overlay */}
                    {!isPremium && (
                        <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
                            <View style={styles.proOverlay}>
                                <LinearGradient
                                    colors={isDark ? ['#1e3a8a', '#1e40af'] : ['#eff6ff', '#dbeafe']}
                                    style={styles.proIconContainer}
                                >
                                    <Ionicons name="lock-closed" size={24} color="#3b82f6" />
                                </LinearGradient>
                                <Text style={styles.proTitle}>Spend Review Pro</Text>
                                <Text style={styles.proDesc}>Unlock advanced charts & analysis.</Text>
                                <TouchableOpacity style={styles.proBtn} onPress={() => router.push('/settings')}>
                                    <Text style={styles.proBtnText}>Unlock Pro</Text>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView >
        </View >
    );
}

const createStyles = (isDark: boolean, windowWidth: number) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#000' : '#f8fafc' },
    headerSafeArea: { backgroundColor: isDark ? '#000' : '#f8fafc' },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
        paddingTop: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: isDark ? '#fff' : '#1e293b',
        letterSpacing: -0.5,
    },
    content: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 4 },

    timelineController: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#111827' : '#fff',
        borderRadius: 20,
        padding: 6,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? '#1f2937' : '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: isDark ? '#1f2937' : '#f8fafc',
        borderRadius: 14,
    },
    dropdownText: { fontSize: 13, fontWeight: '900', color: isDark ? '#fff' : '#1e293b' },
    navVDivider: { width: 1, height: 20, backgroundColor: isDark ? '#1f2937' : '#f1f5f9', marginHorizontal: 8 },
    dateNavigator: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#1f2937' : '#f8fafc' },
    dateLabelContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
    dateMainLabel: { fontSize: 13, fontWeight: '900', color: isDark ? '#fff' : '#1e293b', letterSpacing: -0.3 },
    dateSubLabel: { fontSize: 8, fontWeight: '900', color: '#3b82f6', marginTop: 1, letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    pickerCard: { width: '100%', maxWidth: 300, backgroundColor: isDark ? '#111827' : '#fff', borderRadius: 24, padding: 8, borderWidth: 1, borderColor: isDark ? '#1f2937' : '#f1f5f9' },
    pickerItem: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16 },
    pickerItemActive: { backgroundColor: isDark ? '#1f2937' : '#f1f5f9' },
    pickerItemContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerItemText: { fontSize: 15, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' },
    pickerItemTextActive: { color: '#3b82f6' },

    compactCard: {
        backgroundColor: isDark ? '#111827' : '#fff',
        borderRadius: 24,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: isDark ? '#1f2937' : '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    compactTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    compactLabel: { fontSize: 10, fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    compactBalance: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5 },
    compactIconBg: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    compactStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: isDark ? '#1f2937' : '#f1f5f9'
    },
    compactStatItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    compactStatValue: { fontSize: 14, fontWeight: '800' },
    compactVDivider: { width: 1, height: 16, backgroundColor: isDark ? '#1f2937' : '#f1f5f9' },

    chartsGrid: { gap: 16 },
    chartCard: { backgroundColor: isDark ? '#111827' : '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: isDark ? '#1f2937' : 'rgba(0,0,0,0.02)' },
    chartHeader: { marginBottom: 16 },
    chartTitle: { fontSize: 11, fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 1.5 },
    axisText: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
    pointerLabel: { padding: 8, backgroundColor: isDark ? '#111827' : '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', width: 90, alignItems: 'center', justifyContent: 'center', marginLeft: -45, marginTop: -40 },
    pointerText: { fontSize: 10, fontWeight: '900', color: isDark ? '#fff' : '#1e293b' },

    emptyView: { height: 140, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, marginTop: 10, fontWeight: '600' },
    pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pieLegend: { flex: 1, marginLeft: 20, gap: 8 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendName: { fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700' },

    proSectionContainer: { position: 'relative', overflow: 'hidden', borderRadius: 24 },
    proOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    proIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    proTitle: { fontSize: 18, fontWeight: '900', color: isDark ? '#fff' : '#1e293b' },
    proDesc: { fontSize: 12, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' },
    proBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#3b82f6', borderRadius: 20, marginTop: 4 },
    proBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
