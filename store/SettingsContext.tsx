import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { useColorScheme as useRNColorScheme } from "react-native";

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string; // Ionicons name
}

interface SettingsContextType {
    currency: string;
    categories: Category[];
    name: string;
    avatar: string;
    budget: number;
    notificationsEnabled: boolean;
    reminderTime: string;
    appLockEnabled: boolean;
    securityPin: string | null;
    theme: 'system' | 'light' | 'dark' | 'custom';
    accentColor: 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
    lastSyncTime: number | null;
    updateSettings: (settings: Partial<{
        currency: string;
        name: string;
        avatar: string;
        budget: number;
        notificationsEnabled: boolean;
        reminderTime: string;
        appLockEnabled: boolean;
        securityPin: string | null;
        theme: 'system' | 'light' | 'dark' | 'custom';
        accentColor: 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
        lastSyncTime: number | null;
    }>) => void;
    addCategory: (name: string, color: string, icon: string) => void;
    updateCategory: (id: string, name: string, color: string, icon: string) => void;
    deleteCategory: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
    { id: "1", name: "Food", color: "#EF4444", icon: "fast-food" },
    { id: "2", name: "Transport", color: "#F59E0B", icon: "car" },
    { id: "3", name: "Shopping", color: "#10B981", icon: "cart" },
    { id: "4", name: "Entertainment", color: "#8B5CF6", icon: "game-controller" },
    { id: "5", name: "Bills", color: "#6366F1", icon: "receipt" },
    { id: "6", name: "Health", color: "#EC4899", icon: "medkit" },
    { id: "7", name: "Tech", color: "#3B82F6", icon: "hardware-chip" },
    { id: "8", name: "Travel", color: "#14B8A6", icon: "airplane" },
];

const SETTINGS_KEY = "@daily_xpense_settings_v1"; // Bump version

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { setColorScheme } = useColorScheme();
    const systemScheme = useRNColorScheme();
    const [currency, setCurrency] = useState("₹");
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState("👤");
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [budget, setBudget] = useState(0);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState("20:00");
    const [appLockEnabled, setAppLockEnabled] = useState(false);
    const [securityPin, setSecurityPin] = useState<string | null>(null);
    const [theme, setTheme] = useState<'system' | 'light' | 'dark' | 'custom'>('system');
    const [accentColor, setAccentColor] = useState<'emerald' | 'rose' | 'amber' | 'violet' | 'cyan'>('emerald');
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    // Effect to sync NativeWind with system theme when in 'system' mode
    useEffect(() => {
        if (theme === 'system') {
            setColorScheme(systemScheme || 'light');
        }
    }, [theme, systemScheme, setColorScheme]);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setCurrency(parsed.currency || "₹");
                setName(parsed.name || "");
                setAvatar(parsed.avatar || "👤");
                setBudget(parsed.budget || 0);
                setNotificationsEnabled(parsed.notificationsEnabled || false);
                setReminderTime(parsed.reminderTime || "20:00");
                setAppLockEnabled(parsed.appLockEnabled || false);
                setSecurityPin(parsed.securityPin || null);

                const loadedTheme = parsed.theme || 'system';
                setTheme(loadedTheme);
                setAccentColor(parsed.accentColor || 'emerald');
                // Sync with NativeWind
                if (loadedTheme !== 'system') {
                    setColorScheme(loadedTheme === 'custom' ? 'light' : loadedTheme);
                } else {
                    // The useEffect above will handle system sync
                }

                setLastSyncTime(parsed.lastSyncTime || null);

                const loadedCats = parsed.categories || DEFAULT_CATEGORIES;
                const validatedCats = loadedCats.map((c: any) => ({
                    ...c,
                    icon: c.icon || "pricetag"
                }));
                setCategories(validatedCats);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const saveSettings = async (newSettings: any) => {
        try {
            const merged = {
                currency, name, avatar, categories,
                budget, notificationsEnabled, reminderTime,
                appLockEnabled, securityPin, theme, accentColor, lastSyncTime,
                ...newSettings
            };
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    };

    const updateSettings = (updates: any) => {
        if (updates.currency !== undefined) setCurrency(updates.currency);
        if (updates.name !== undefined) setName(updates.name);
        if (updates.avatar !== undefined) setAvatar(updates.avatar);
        if (updates.budget !== undefined) setBudget(updates.budget);
        if (updates.notificationsEnabled !== undefined) setNotificationsEnabled(updates.notificationsEnabled);
        if (updates.reminderTime !== undefined) setReminderTime(updates.reminderTime);
        if (updates.appLockEnabled !== undefined) setAppLockEnabled(updates.appLockEnabled);
        if (updates.securityPin !== undefined) setSecurityPin(updates.securityPin);

        if (updates.theme !== undefined) {
            setTheme(updates.theme);
            setTheme(updates.theme);
            if (updates.theme !== 'system') {
                setColorScheme(updates.theme === 'custom' ? 'light' : updates.theme);
            }
        }

        if (updates.accentColor !== undefined) setAccentColor(updates.accentColor);

        if (updates.lastSyncTime !== undefined) setLastSyncTime(updates.lastSyncTime);

        saveSettings(updates);
    };

    const addCategory = (name: string, color: string, icon: string) => {
        const newCat = { id: Date.now().toString(), name, color, icon };
        const updated = [...categories, newCat];
        setCategories(updated);
        saveSettings({ categories: updated });
    };

    const updateCategory = (id: string, name: string, color: string, icon: string) => {
        const updated = categories.map(c =>
            c.id === id ? { ...c, name, color, icon } : c
        );
        setCategories(updated);
        saveSettings({ categories: updated });
    };

    const deleteCategory = (id: string) => {
        if (categories.length <= 1) return;
        const updated = categories.filter(c => c.id !== id);
        setCategories(updated);
        saveSettings({ categories: updated });
    };

    return (
        <SettingsContext.Provider value={{
            currency, name, avatar, categories,
            budget, notificationsEnabled, reminderTime,
            appLockEnabled, securityPin, theme, accentColor, lastSyncTime,
            updateSettings, addCategory, updateCategory, deleteCategory
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
