import "../global.css";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme as useRNColorScheme } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ExpenseProvider } from "../store/ExpenseContext";
import { SettingsProvider, useSettings } from "../store/SettingsContext";
import { AuthProvider, useAuth } from "../store/AuthContext";

function RootStack() {
    const { theme, accentColor } = useSettings();
    const systemScheme = useRNColorScheme();
    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

    return (
        <>
            <Stack screenOptions={{ contentStyle: { backgroundColor: isDark ? 'black' : 'white' } }}>
                <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ presentation: "modal", title: "Settings" }} />
            </Stack>
            <StatusBar style={isDark ? 'light' : 'dark'} />
        </>
    );
}

export default function Layout() {
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
