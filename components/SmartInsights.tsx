import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useExpenses } from '../store/ExpenseContext';
import { useSettings } from '../store/SettingsContext';
import { InsightsService, Insight } from '../services/InsightsService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const SmartInsights = () => {
    const { expenses } = useExpenses();
    const { theme, currency } = useSettings();
    const isDark = theme === 'dark';

    const insights = useMemo(() => InsightsService.getInsights(expenses, currency), [expenses, currency]);

    if (insights.length === 0) return null;

    const getGradientColors = (insight: Insight): readonly [string, string] => {
        if (insight.type === 'alert' || (insight.type === 'velocity' && insight.sentiment === 'negative')) {
            return isDark ? ['#ef4444' + '20', '#ef4444' + '05'] as const : ['#fee2e2', '#fff1f1'] as const;
        }
        if (insight.type === 'velocity' && insight.sentiment === 'positive') {
            return isDark ? ['#10b981' + '20', '#10b981' + '05'] as const : ['#d1fae5', '#f0fdf4'] as const;
        }
        return isDark ? ['#3b82f6' + '20', '#3b82f6' + '05'] as const : ['#eff6ff', '#f8fafc'] as const;
    };

    const getIconColor = (insight: Insight) => {
        if (insight.type === 'alert' || (insight.type === 'velocity' && insight.sentiment === 'negative')) return isDark ? '#f87171' : '#dc2626';
        if (insight.type === 'velocity' && insight.sentiment === 'positive') return isDark ? '#34d399' : '#059669';
        return isDark ? '#60a5fa' : '#2563eb';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                <Text style={[styles.title, isDark && styles.textLight]}>Spend Review</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={280 + 12}
                decelerationRate="fast"
            >
                {insights.map((insight, index) => (
                    <View key={index} style={[styles.card, isDark && styles.cardDark]}>
                        <LinearGradient
                            colors={getGradientColors(insight)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBg}
                        />
                        <View style={styles.cardContent}>
                            <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                                <Ionicons name={insight.icon as any} size={22} color={getIconColor(insight)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, isDark && styles.textLight]} numberOfLines={1}>{insight.title}</Text>
                                <Text style={[styles.cardMessage, isDark && styles.subTextLight]} numberOfLines={2}>{insight.message}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
        gap: 6
    },
    title: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    textLight: {
        color: '#94a3b8',
    },
    subTextLight: {
        color: '#9ca3af',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 4,
        gap: 12,
    },
    card: {
        width: 280,
        borderRadius: 22,
        backgroundColor: 'white',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)'
    },
    cardDark: {
        backgroundColor: '#111827',
        borderColor: '#1f2937',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
    },
    cardContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    iconContainerDark: {
        backgroundColor: '#1f2937',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 2,
    },
    cardMessage: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        lineHeight: 16,
    }
});
