import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { useColorScheme as useRNColorScheme, Platform, AppState, AppStateStatus } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { db } from "../db/client";
import { settings as settingsSchema } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPin } from "../lib/crypto";
import { registerForPushNotificationsAsync, checkPermissionStatus, scheduleLocalNotification } from "../lib/notifications";

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string; // Ionicons name
    type?: 'expense' | 'income'; // Defaults to 'expense'
}

interface SettingsContextType {
    currency: string;
    locale: string;
    categories: Category[];
    name: string;
    avatar: string;
    budget: number;
    notificationsEnabled: boolean;
    reminderTime: string;
    appLockEnabled: boolean;
    securityPin: string | null;
    biometricsEnabled: boolean;
    theme: 'system' | 'light' | 'dark' | 'custom';
    accentColor: 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
    lastSyncTime: number | null;
    maxAmount: number;
    isPremium: boolean;
    isLoading: boolean;
    isAppUnlocked: boolean;
    setIsAppUnlocked: (unlocked: boolean) => void;
    updateSettings: (settings: Partial<{
        currency: string;
        locale: string;
        name: string;
        avatar: string;
        budget: number;
        notificationsEnabled: boolean;
        reminderTime: string;
        appLockEnabled: boolean;
        securityPin: string | null;
        biometricsEnabled: boolean;
        theme: 'system' | 'light' | 'dark' | 'custom';
        accentColor: 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
        lastSyncTime: number | null;
        maxAmount: number;
        isPremium: boolean;
    }>) => void;
    addCategory: (name: string, color: string, icon: string, type?: 'expense' | 'income') => void;
    updateCategory: (id: string, name: string, color: string, icon: string, type?: 'expense' | 'income') => void;
    deleteCategory: (id: string) => void;
    scheduleNotification: (title: string, body: string) => Promise<void>; // Exposed for manual triggering
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
    { id: "1", name: "Food", color: "#EF4444", icon: "fast-food", type: 'expense' },
    { id: "2", name: "Transport", color: "#F59E0B", icon: "car", type: 'expense' },
    { id: "3", name: "Shopping", color: "#10B981", icon: "cart", type: 'expense' },
    { id: "4", name: "Entertainment", color: "#8B5CF6", icon: "game-controller", type: 'expense' },
    { id: "5", name: "Bills", color: "#6366F1", icon: "receipt", type: 'expense' },
    { id: "6", name: "Health", color: "#EC4899", icon: "medkit", type: 'expense' },
    { id: "7", name: "Tech", color: "#3B82F6", icon: "hardware-chip", type: 'expense' },
    { id: "8", name: "Travel", color: "#14B8A6", icon: "airplane", type: 'expense' },
    // Income Categories
    { id: "9", name: "Salary", color: "#10B981", icon: "cash", type: 'income' },
    { id: "10", name: "Freelance", color: "#3B82F6", icon: "laptop", type: 'income' },
    { id: "11", name: "Installation", color: "#F59E0B", icon: "construct", type: 'income' },
    { id: "12", name: "Service", color: "#8B5CF6", icon: "build", type: 'income' },
];

const SETTINGS_KEY = "@daily_xpense_settings_v1"; // Bump version

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { setColorScheme } = useColorScheme();
    const systemScheme = useRNColorScheme();
    const { user } = useAuth();
    const userId = user?.id || "offline_user";

    const [currency, setCurrency] = useState("₹");
    const [locale, setLocale] = useState("en-IN");
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState("👤");
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [budget, setBudget] = useState(0);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState("20:00");
    const [appLockEnabled, setAppLockEnabled] = useState(false);
    const [securityPin, setSecurityPin] = useState<string | null>(null);
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [theme, setTheme] = useState<'system' | 'light' | 'dark' | 'custom'>('system');
    const [accentColor, setAccentColor] = useState<'emerald' | 'rose' | 'amber' | 'violet' | 'cyan'>('emerald');
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [maxAmount, setMaxAmount] = useState(1000000); // Default 10L
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAppUnlocked, setIsAppUnlocked] = useState(false);
    const [lastBackgroundTime, setLastBackgroundTime] = useState<number | null>(null);

    useEffect(() => {
        if (userId) loadSettings();
    }, [userId]);

    // Effect to sync NativeWind with app theme
    useEffect(() => {
        if (theme === 'system') {
            setColorScheme(systemScheme || 'light');
        } else if (theme === 'light' || theme === 'dark') {
            setColorScheme(theme);
        }
    }, [theme, systemScheme, setColorScheme]);

    // Verify Notifications Permission on Resume (or Load)
    useEffect(() => {
        const checkPerms = async () => {
            // If app thinks notifications are ON, but OS says NO, we must sync state.
            // But we don't want to auto-disable it immediately on load creating UI jump.
            // Be careful here.
            // Strategy: If notificationsEnabled is TRUE, check real permission.
            // If real permission is FALSE, set notificationsEnabled = FALSE.
            if (notificationsEnabled) {
                const hasPerm = await checkPermissionStatus();
                if (!hasPerm) {
                    // Silent sync: User has revoked permission outside app (or re-installed).
                    // We update state to false so toggle is OFF. User must toggle ON to re-trigger prompt.
                    setNotificationsEnabled(false);
                    // Optionally update DB? Maybe not strictly necessary to spam DB call here,
                    // but good for consistency. We'll skip DB save for now to avoid side-effects during render cycles
                    // unless user explicitly interacts, but local state MUST reflect reality.
                }
            }
        };

        checkPerms();

        // Also check on app foregrounding
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkPerms();
            }
        });

        return () => subscription.remove();
    }, [notificationsEnabled]); // Re-run if enabled changes (though mainly we care about resume)

    // Background Auto-Lock logic with 30s Grace Period
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                // Store the time we went to background
                setLastBackgroundTime(Date.now());
            } else if (nextAppState === 'active') {
                if (appLockEnabled && lastBackgroundTime) {
                    const elapsed = Date.now() - lastBackgroundTime;
                    // Lock if gone for more than 30 seconds
                    if (elapsed > 30000) {
                        setIsAppUnlocked(false);
                    }
                }
                setLastBackgroundTime(null);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [appLockEnabled, lastBackgroundTime]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            let loadedSettings: any = null;

            // 1. Load from Local DB (Native only) or Web (Supabase only initially)
            if (Platform.OS === 'web') {
                const { data } = await supabase.from('settings').select('*').eq('user_id', userId).single();
                if (data) loadedSettings = data;
            } else {
                // Native: Load from SQLite (Cache)
                const result = await db.query.settings.findFirst({
                    where: eq(settingsSchema.userId, userId)
                });
                if (result) {
                    loadedSettings = result;
                    applySettings(loadedSettings); // Render fast with cache
                }

                // Native: Fetch from Supabase (Sync Down)
                const { data: cloudData } = await supabase.from('settings').select('*').eq('user_id', userId).single();
                if (cloudData) {
                    // Cloud data found, updating local...
                    loadedSettings = cloudData;
                    // Update cache
                    await saveToLocalDb(cloudData);
                }
            }

            // 2. Fallback to AsyncStorage (Migration)
            if (!loadedSettings) {
                const savedAsync = await AsyncStorage.getItem(SETTINGS_KEY);
                if (savedAsync) {
                    loadedSettings = JSON.parse(savedAsync);
                    saveSettingsToDb(loadedSettings);
                }
            }

            if (loadedSettings) {
                applySettings(loadedSettings);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        } finally {
            setIsLoading(false);
        }
    };

    const applySettings = (s: any) => {
        // Parse DB fields (snake_case from Supabase/SQLite usually, but Drizzle mapping might help)
        setCurrency(s.currency || "₹");
        setLocale(s.locale || "en-IN");
        setName(s.name || "");
        setAvatar(s.avatar || "👤");
        setBudget(s.budget || 0);
        setMaxAmount(s.maxAmount ?? s.max_amount ?? 1000000);
        const premium = s.isPremium ?? s.is_premium;
        setIsPremium(premium === true || premium === 1);

        // Handle booleans (SQLite stores 0/1, Supabase bool)
        const notif = s.notificationsEnabled ?? s.notifications_enabled;
        setNotificationsEnabled(notif === true || notif === 1);

        const reminder = s.reminderTime ?? s.reminder_time;
        setReminderTime(reminder || "20:00");

        const alock = s.appLockEnabled ?? s.app_lock_enabled;
        const isEnabled = alock === true || alock === 1;
        setAppLockEnabled(isEnabled);
        // Only set to true if lock is disabled. If enabled, it MUST be false initially to show lock screen
        setIsAppUnlocked(!isEnabled);

        const pin = s.securityPin ?? s.security_pin;
        if (pin && pin.length === 4) {
            // Legacy PIN found, migrate to hash immediately
            hashPin(pin).then(hashed => {
                setSecurityPin(hashed);
                // Persist the migration
                updateSettings({ securityPin: hashed });
            });
        } else {
            setSecurityPin(pin || null);
        }

        const bio = s.biometricsEnabled ?? s.biometrics_enabled;
        setBiometricsEnabled(bio === true || bio === 1);

        const themeVal = s.theme || 'system';
        setTheme(themeVal);

        const accent = s.accentColor ?? s.accent_color;
        setAccentColor(accent || 'emerald');

        const catsRaw = s.categories;
        let loadedCats = DEFAULT_CATEGORIES;
        if (typeof catsRaw === 'string') {
            try { loadedCats = JSON.parse(catsRaw); } catch (e) { }
        } else if (Array.isArray(catsRaw)) {
            loadedCats = catsRaw;
        }

        const validIncomeNames = ["Salary", "Freelance", "Installation", "Service"];
        const validatedCats = loadedCats.map((c: any) => {
            // Smart migration: If type is missing, check if it's a known income category
            let resolvedType = c.type;
            if (!resolvedType) {
                if (validIncomeNames.includes(c.name)) {
                    resolvedType = 'income';
                } else {
                    resolvedType = 'expense';
                }
            }
            return {
                ...c,
                icon: c.icon || "pricetag",
                type: resolvedType
            };
        });
        setCategories(validatedCats);

        setLastSyncTime(s.lastSyncTime ?? s.last_sync_time ?? Date.now());
    };

    const saveToLocalDb = async (payload: any) => {
        const now = new Date();
        // Upsert to SQLite
        // sqlite doesn't have UPSERT in generic SQL easily without syntax check, 
        // but Drizzle insert().onConflictDoUpdate() works
        try {
            await db.insert(settingsSchema).values({
                ...payload,
                userId: userId, // Fix: Explicitly map userId for Drizzle
                locale: payload.locale,
                updatedAt: now,
                notificationsEnabled: payload.notifications_enabled, // map back to camel for Drizzle
                reminderTime: payload.reminder_time,
                appLockEnabled: payload.app_lock_enabled,
                securityPin: payload.security_pin,
                accentColor: payload.accent_color,
                categories: payload.categories,
                maxAmount: payload.max_amount,
                isPremium: payload.is_premium,
                deleted: false
            }).onConflictDoUpdate({
                target: settingsSchema.id,
                set: {
                    userId: userId, // Fix: Explicitly map userId for Drizzle
                    currency: payload.currency,
                    locale: payload.locale,
                    name: payload.name,
                    avatar: payload.avatar,
                    budget: payload.budget,
                    notificationsEnabled: payload.notifications_enabled,
                    reminderTime: payload.reminder_time,
                    appLockEnabled: payload.app_lock_enabled,
                    securityPin: payload.security_pin,
                    theme: payload.theme,
                    accentColor: payload.accent_color,
                    categories: payload.categories,
                    maxAmount: payload.max_amount,
                    isPremium: payload.is_premium,
                    updatedAt: now,
                    syncStatus: 'PENDING'
                }
            });
        } catch (e) {
            console.error("Failed to save to local DB", e);
        }
    };

    const saveSettingsToDb = async (merged: any) => {
        const now = new Date();
        const isWeb = Platform.OS === 'web';

        // Prepare Payload (Snake Case for DBs)
        const payload = {
            id: userId, // Ensure one row per user
            user_id: userId,
            currency: merged.currency,
            locale: merged.locale,
            name: merged.name,
            avatar: merged.avatar,
            budget: merged.budget,
            notifications_enabled: merged.notificationsEnabled,
            reminder_time: merged.reminderTime,
            app_lock_enabled: merged.appLockEnabled,
            security_pin: merged.securityPin,
            theme: merged.theme,
            accent_color: merged.accentColor,
            categories: JSON.stringify(merged.categories),
            max_amount: merged.maxAmount,
            is_premium: merged.isPremium,
            updated_at: now.toISOString(),
            sync_status: 'PENDING'
        };

        try {
            // 1. Sync to Supabase (All Platforms)
            // ONLY if logged in (not offline_user)
            if (userId !== "offline_user") {
                const { error } = await supabase.from('settings').upsert(payload);

                if (error) {
                    console.error("Supabase settings sync error", error);
                }
            }

            // 2. Save to Local DB (Native Only)
            if (!isWeb) {
                await saveToLocalDb(payload);
            }
        } catch (e) {
            console.error("Failed to save settings to DB", e);
        }
    };

    const saveSettings = async (newSettings: any) => {
        try {
            const merged = {
                currency, locale, name, avatar, categories,
                budget, notificationsEnabled, reminderTime,
                appLockEnabled, securityPin, biometricsEnabled, theme, accentColor, lastSyncTime, maxAmount, isPremium,
                ...newSettings
            };
            // 1. Save Local (Fast)
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));

            // 2. Persist to DB (Async)
            saveSettingsToDb(merged);

        } catch (e) {
            console.error("Failed to save settings", e);
        }
    };

    const updateSettings = (updates: any) => {
        if (updates.currency !== undefined) setCurrency(updates.currency);
        if (updates.locale !== undefined) setLocale(updates.locale);
        if (updates.name !== undefined) setName(updates.name);
        if (updates.avatar !== undefined) setAvatar(updates.avatar);
        if (updates.budget !== undefined) setBudget(updates.budget);
        if (updates.budget !== undefined) setBudget(updates.budget);

        if (updates.notificationsEnabled !== undefined) {
            // Logic: If turning ON, we must request/check permission first.
            if (updates.notificationsEnabled === true) {
                // We're inside a sync function but need async, so we'll fire and forget the permission check
                // OR we handle it optimistically. Better to force the UI check in 'app/settings.tsx' 
                // BUT current architecture puts all logic here.
                // We will blindly set it here, but relied on the useEffect 'checkPerms' or the UI to handle the heavy lifting.
                // Actually, let's keep it simple: State is source of truth.
                setNotificationsEnabled(true);
            } else {
                setNotificationsEnabled(false);
            }
        }

        if (updates.reminderTime !== undefined) setReminderTime(updates.reminderTime);
        if (updates.appLockEnabled !== undefined) {
            setAppLockEnabled(updates.appLockEnabled);
            // If turning OFF, unlock everything immediately
            if (!updates.appLockEnabled) setIsAppUnlocked(true);
            // If turning ON, they are already authorized in settings, so keep it true for this session
            else setIsAppUnlocked(true);
        }
        if (updates.securityPin !== undefined) setSecurityPin(updates.securityPin);
        if (updates.biometricsEnabled !== undefined) setBiometricsEnabled(updates.biometricsEnabled);

        if (updates.theme !== undefined) {
            setTheme(updates.theme);
            setTheme(updates.theme);
            if (updates.theme !== 'system') {
                setColorScheme(updates.theme === 'custom' ? 'light' : updates.theme);
            }
        }

        if (updates.accentColor !== undefined) setAccentColor(updates.accentColor);

        if (updates.maxAmount !== undefined) setMaxAmount(updates.maxAmount);
        if (updates.isPremium !== undefined) setIsPremium(updates.isPremium);

        saveSettings(updates);
    };

    const addCategory = (name: string, color: string, icon: string, type: 'expense' | 'income' = 'expense') => {
        const newCat: Category = { id: Date.now().toString(), name, color, icon, type };
        const updated = [...categories, newCat];
        setCategories(updated);
        saveSettings({ categories: updated });
    };

    const updateCategory = (id: string, name: string, color: string, icon: string, type: 'expense' | 'income' = 'expense') => {
        const updated = categories.map(c =>
            c.id === id ? { ...c, name, color, icon, type } : c
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
            currency, locale, name, avatar, categories,
            budget, notificationsEnabled, reminderTime,
            appLockEnabled, securityPin, biometricsEnabled, theme, accentColor, lastSyncTime, maxAmount, isPremium,
            isLoading, isAppUnlocked,
            updateSettings, addCategory, updateCategory, deleteCategory, setIsAppUnlocked,
            scheduleNotification: (t, b) => scheduleLocalNotification(t, b)
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
