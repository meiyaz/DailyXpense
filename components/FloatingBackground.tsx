import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FloatingIcon = ({ name, size, color, delay, duration, startPos }: {
    name: any,
    size: number,
    color: string,
    delay: number,
    duration: number,
    startPos: { x: number, y: number }
}) => {
    const translateY = useSharedValue(startPos.y);
    const translateX = useSharedValue(startPos.x);
    const opacity = useSharedValue(0.05);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Large scale floating movement
        translateY.value = withDelay(delay, withRepeat(
            withTiming(startPos.y - 120, { duration, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        ));
        translateX.value = withDelay(delay, withRepeat(
            withTiming(startPos.x + 40, { duration: duration * 1.5, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        ));
        opacity.value = withDelay(delay, withRepeat(
            withTiming(0.12, { duration: duration / 2 }),
            -1,
            true
        ));
        rotate.value = withDelay(delay, withRepeat(
            withTiming(360, { duration: duration * 5, easing: Easing.linear }),
            -1,
            false
        ));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` }
        ],
        opacity: opacity.value,
        position: 'absolute',
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={size} color={color} />
        </Animated.View>
    );
};

export const FloatingBackground = () => {
    const icons = [
        { name: 'card-outline', size: 45, color: '#3b82f6' },
        { name: 'cash-outline', size: 30, color: '#10b981' },
        { name: 'receipt-outline', size: 40, color: '#f59e0b' },
        { name: 'wallet-outline', size: 50, color: '#6366f1' },
        { name: 'pie-chart-outline', size: 30, color: '#ec4899' },
        { name: 'trending-up-outline', size: 40, color: '#06b6d4' },
        { name: 'cart-outline', size: 35, color: '#8b5cf6' },
        { name: 'briefcase-outline', size: 35, color: '#64748b' },
        { name: 'analytics-outline', size: 40, color: '#2563eb' },
        { name: 'calculator-outline', size: 30, color: '#0f172a' },
    ];

    return (
        <View style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} pointerEvents="none">
            {icons.map((icon, i) => (
                <FloatingIcon
                    key={`icon-1-${i}`}
                    name={icon.name}
                    size={icon.size}
                    color={icon.color}
                    delay={i * 600}
                    duration={5000 + (i * 700)}
                    startPos={{
                        // Distribute across full width and height
                        x: (width / (icons.length / 2)) * (i % (icons.length / 2)) + (Math.random() * 50),
                        y: (height / icons.length) * i + (Math.random() * 50)
                    }}
                />
            ))}
            {/* Secondary layer for more density */}
            {icons.map((icon, i) => (
                <FloatingIcon
                    key={`icon-2-${i}`}
                    name={icon.name}
                    size={icon.size * 0.8}
                    color={icon.color}
                    delay={i * 900 + 400}
                    duration={6000 + (i * 400)}
                    startPos={{
                        x: (width / (icons.length / 2)) * (i % (icons.length / 2)) + (Math.random() * width * 0.2),
                        y: (height / icons.length) * (icons.length - i) - (Math.random() * 50)
                    }}
                />
            ))}
        </View>
    );
};
