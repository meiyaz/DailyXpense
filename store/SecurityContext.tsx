import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

interface SecurityContextType {
    hasPin: boolean;
    isBiometricsEnabled: boolean;
    isLocked: boolean;
    setPin: (pin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    authenticateWithBiometrics: () => Promise<boolean>;
    toggleBiometrics: (enabled: boolean) => Promise<void>;
    unlock: () => void;
    lock: () => void;
    clearSecurity: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const PIN_KEY = "user_security_pin";
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const [hasPin, setHasPin] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSecuritySettings();
    }, []);

    const loadSecuritySettings = async () => {
        try {
            const pin = await SecureStore.getItemAsync(PIN_KEY);
            const biometricEnabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);

            setHasPin(!!pin);
            setIsBiometricsEnabled(biometricEnabled === "true");

            // If they have a PIN, the app starts locked
            if (pin) {
                setIsLocked(true);
            }
        } catch (error) {
            console.error("Failed to load security settings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setPin = async (pin: string) => {
        await SecureStore.setItemAsync(PIN_KEY, pin);
        setHasPin(true);
        setIsLocked(false);
    };

    const verifyPin = async (pin: string): Promise<boolean> => {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        if (storedPin === pin) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const toggleBiometrics = async (enabled: boolean) => {
        if (enabled) {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            if (!compatible) {
                Alert.alert("Error", "Biometrics not supported on this device.");
                return;
            }
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (!enrolled) {
                Alert.alert("Error", "No biometrics enrolled on this device.");
                return;
            }
        }
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
        setIsBiometricsEnabled(enabled);
    };

    const authenticateWithBiometrics = async (): Promise<boolean> => {
        if (!isBiometricsEnabled) return false;

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock DailyXpense",
            fallbackLabel: "Use PIN",
        });

        if (result.success) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const unlock = () => setIsLocked(false);
    const lock = () => {
        if (hasPin) setIsLocked(true);
    };

    const clearSecurity = async () => {
        await SecureStore.deleteItemAsync(PIN_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        setHasPin(false);
        setIsBiometricsEnabled(false);
        setIsLocked(false);
    };

    return (
        <SecurityContext.Provider
            value={{
                hasPin,
                isBiometricsEnabled,
                isLocked,
                setPin,
                verifyPin,
                authenticateWithBiometrics,
                toggleBiometrics,
                unlock,
                lock,
                clearSecurity,
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
}

export function useSecurity() {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
}
