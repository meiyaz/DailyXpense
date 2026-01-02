import "../global.css";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme as useRNColorScheme, Platform } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useEffect, useState } from "react";
import { ExpenseProvider } from "../store/ExpenseContext";
import { SettingsProvider, useSettings } from "../store/SettingsContext";
import { AuthProvider, useAuth } from "../store/AuthContext";
import { migrateDb } from "../db/client";

import LockScreen from "../components/LockScreen";

function RootStack() {
    const { theme, accentColor, appLockEnabled, isAppUnlocked, securityPin, isLoading: settingsLoading } = useSettings();
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

        // If app is locked, we don't redirect to login yet, LockScreen handles it
        if (appLockEnabled && !isAppUnlocked) return;

        const inAuthGroup = segments[0] === 'login';

        // Use requestAnimationFrame to ensure the navigator is ready for the action
        requestAnimationFrame(() => {
            if (!isAuthenticated && !inAuthGroup) {
                router.replace('/login');
            } else if (isAuthenticated && inAuthGroup) {
                router.replace('/');
            }
        });
    }, [isAuthenticated, isLoading, segments, appLockEnabled, isAppUnlocked, navigationState?.key]);

    if (isLoading) {
        return <View style={{ flex: 1, backgroundColor: isDark ? 'black' : 'white' }} />;
    }

    // INTERCEPT: App Lock (Only if authenticated and not on the login screen)
    const inAuthGroup = segments[0] === 'login';
    if (isAuthenticated && !inAuthGroup && appLockEnabled && !isAppUnlocked) {
        return <LockScreen />;
    }

    return (
        <>
            <Stack screenOptions={{
                contentStyle: { backgroundColor: isDark ? 'black' : 'white' },
                animation: 'slide_from_right',
                animationDuration: 200
            }}>
                <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ presentation: "modal", title: "Settings" }} />
                <Stack.Screen name="dashboard" options={{
                    title: "Dashboard",
                    headerBackTitle: "Home",
                    headerShadowVisible: false,
                    // Dynamic styling handled via screenOptions or component if needed, 
                    // but static options here are safer.
                    // Note: accessing isDark here works because RootStack is inside SettingsProvider
                    headerStyle: { backgroundColor: isDark ? '#000000' : '#f9fafb' },
                    headerTintColor: isDark ? 'white' : 'black',
                }} />
            </Stack>
            <StatusBar style={isDark ? 'light' : 'dark'} />
        </>
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
