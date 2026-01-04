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
            return isDark ? ['#7f1d1d', '#991b1b'] as const : ['#fee2e2', '#fecaca'] as const; // Red-ish
        }
        if (insight.type === 'velocity' && insight.sentiment === 'positive') {
            return isDark ? ['#064e3b', '#065f46'] as const : ['#d1fae5', '#a7f3d0'] as const; // Green-ish
        }
        return isDark ? ['#1e3a8a', '#1e40af'] as const : ['#eff6ff', '#dbeafe'] as const; // Blue-ish
    };

    const getIconColor = (insight: Insight) => {
        if (insight.type === 'alert' || (insight.type === 'velocity' && insight.sentiment === 'negative')) return '#ef4444';
        if (insight.type === 'velocity' && insight.sentiment === 'positive') return '#10b981';
        return '#3b82f6';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="sparkles" size={18} color="#8b5cf6" />
                <Text style={[styles.title, isDark && styles.textLight]}>Smart Insights</Text>
            </View>

            <View style={styles.content}>
                {insights.map((insight, index) => (
                    <View key={index} style={[styles.card, isDark && styles.cardDark]}>
                        <LinearGradient
                            colors={getGradientColors(insight)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientBg}
                        />
                        <View style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <Ionicons name={insight.icon as any} size={28} color={getIconColor(insight)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, isDark && styles.textLight]} numberOfLines={1}>{insight.title}</Text>
                                <Text style={[styles.cardMessage, isDark && styles.subTextLight]} numberOfLines={2}>{insight.message}</Text>
                                {!!insight.details && (
                                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="information-circle-outline" size={12} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>
                                            {insight.details}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        width: '100%',
        maxWidth: 600,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
        gap: 8
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
        letterSpacing: -0.5,
    },
    textLight: {
        color: '#f3f4f6',
    },
    subTextLight: {
        color: '#d1d5db',
    },
    content: {
        gap: 16,
    },
    card: {
        width: '100%',
        borderRadius: 24,
        backgroundColor: 'white',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
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
        opacity: 0.15, // More subtle for large cards
    },
    cardContent: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    cardMessage: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4b5563',
        lineHeight: 20,
    }
});
