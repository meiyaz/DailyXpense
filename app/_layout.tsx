import "../global.css";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme as useRNColorScheme, Platform, DimensionValue } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { ExpenseProvider } from "../store/ExpenseContext";
import { SettingsProvider, useSettings } from "../store/SettingsContext";
import { AuthProvider, useAuth } from "../store/AuthContext";
import { migrateDb } from "../db/client";

import LockScreen from "../components/LockScreen";

function RootStack() {
    const { theme, appLockEnabled, biometricsEnabled, isAppUnlocked, isLoading: settingsLoading, name } = useSettings();
    const systemScheme = useRNColorScheme();
    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

    // Auth Protection
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();

    const isLoading = authLoading || settingsLoading;

    useEffect(() => {
        if (isLoading || !navigationState?.key) return;

        // If app is locked AND user is authenticated AND setup is done (has name), we don't redirect to login yet, LockScreen handles it
        if (isAuthenticated && (appLockEnabled || biometricsEnabled) && !isAppUnlocked && name) return;

        const inAuthGroup = segments[0] === 'login';

        // Stabilize transitions with a generous timeout to ensure navigator readiness
        const timeout = setTimeout(() => {
            if (!isAuthenticated && !inAuthGroup) {
                // Force redirect to login if not authenticated
                // We use navigate() instead of replace() here as it's often more 
                // resilient when transitioning away from modal states.
                router.navigate('/login');
            } else if (isAuthenticated && inAuthGroup) {
                // User is authenticated but still on login, return home
                router.navigate('/');
            }
        }, 150);

        return () => clearTimeout(timeout);
    }, [isAuthenticated, isLoading, segments, navigationState?.key, name]);

    if (isLoading) {
        return <View style={{ flex: 1, backgroundColor: isDark ? 'black' : 'white' }} />;
    }

    // INTERCEPT: App Lock or Biometrics (Only if authenticated, not on login, locked, AND setup is complete)
    const inAuthGroup = segments[0] === 'login';
    if (isAuthenticated && !inAuthGroup && (appLockEnabled || biometricsEnabled) && !isAppUnlocked && name) {
        return <LockScreen />;
    }

    // Web-Optimized Layout: Clean, centered, tablet-width column
    const webContainerStyle = Platform.OS === 'web' ? {
        maxWidth: 800,
        width: '100%' as DimensionValue,
        alignSelf: 'center' as const,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    } : { flex: 1 };

    const webWrapperStyle = Platform.OS === 'web' ? {
        backgroundColor: isDark ? '#111' : '#f0f2f5',
        alignItems: 'center' as const,
    } : {};

    return (
        <View style={[{ flex: 1, backgroundColor: isDark ? 'black' : 'white' }, webWrapperStyle]}>
            <View style={[{ flex: 1, width: '100%' as DimensionValue, backgroundColor: isDark ? 'black' : 'white' }, webContainerStyle]}>
                <Stack screenOptions={{
                    contentStyle: { backgroundColor: isDark ? 'black' : 'white' },
                    animation: 'slide_from_right',
                    animationDuration: 200
                }}>
                    <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: false }} />
                    <Stack.Screen name="dashboard" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style={isDark ? 'light' : 'dark'} />
            </View>
        </View>
    );
}

export default function Layout() {
    useEffect(() => {
        migrateDb();
    }, []);

    return (
        <AuthProvider>
            <SettingsProvider>
                <ExpenseProvider>
                    <RootStack />
                </ExpenseProvider>
            </SettingsProvider>
        </AuthProvider>
    );
}
