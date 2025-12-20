import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments, Slot } from "expo-router";

export interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (provider: "google" | "apple" | "email", email?: string) => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "auth_data";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        loadAuth();
    }, []);

    const loadAuth = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            if (jsonValue != null) {
                setUser(JSON.parse(jsonValue));
            }
        } catch (e) {
            console.error("Failed to load auth", e);
        }
    };

    const signIn = (provider: "google" | "apple" | "email", email?: string) => {
        // Dummy user data
        const dummyUser: User = {
            id: "123",
            name: email ? email.split('@')[0] : "Demo User",
            email: email || "user@example.com",
        };
        setUser(dummyUser);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dummyUser));
        router.replace("/");
    };

    const signOut = () => {
        setUser(null);
        AsyncStorage.removeItem(STORAGE_KEY);
        router.replace("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
