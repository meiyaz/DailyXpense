import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, Keyboard, Image, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../store/AuthContext";
import { Stack } from "expo-router";
import { useSettings } from "../store/SettingsContext";
import { useColorScheme as useRNColorScheme } from "react-native";
import { FloatingBackground } from "../components/FloatingBackground";

export default function Login() {
    const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();
    const { theme } = useSettings();
    const systemScheme = useRNColorScheme();
    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

    const [mode, setMode] = useState<"landing" | "email" | "otp">("landing");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [emailError, setEmailError] = useState("");
    const [sendSuccess, setSendSuccess] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (resendTimer <= 0) return;

        const interval = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer > 0]);

    // Clear timer when user authenticates
    useEffect(() => {
        if (isAuthenticated) {
            setResendTimer(0);
        }
    }, [isAuthenticated]);

    // Auto-verify when 6 digits are entered
    useEffect(() => {
        if (otp.length === 6 && !loading) {
            handleVerifyOtp();
        }
    }, [otp]);

    const handleSendOtp = async (isResend = false) => {
        const cleanEmail = email.trim().toLowerCase();
        Keyboard.dismiss();
        setEmailError("");
        setSendSuccess(false);

        if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
            setEmailError("Please enter a valid email address");
            return;
        }

        if (resendTimer > 0 && !isResend) {
            return;
        }

        setLoading(true);
        try {
            const { error } = await sendOtp(cleanEmail);
            if (error) {
                setEmailError(error.message);
            } else {
                setSendSuccess(true);
                if (!isResend) {
                    setTimeout(() => {
                        setMode("otp");
                        setSendSuccess(false);
                    }, 1500);
                }
                setResendTimer(30);
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.trim();

        if (cleanOtp.length !== 6) {
            Alert.alert("Error", "Please enter the 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const { error } = await verifyOtp(cleanEmail, cleanOtp);
            if (error) {
                Alert.alert("Verification Failed", error.message || JSON.stringify(error));
            }
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { error } = await signInWithGoogle();
            if (error) Alert.alert("Google Sign-In Failed", error.message);
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Subtle Texture Overlay */}
            <View style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} pointerEvents="none">
                <Image
                    source={require('../assets/images/premium_ledger_bg.jpg')}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        width: '100%', height: '100%',
                        opacity: 0.02
                    }}
                    resizeMode="cover"
                />
            </View>

            <FloatingBackground />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="flex-1 p-8 justify-between">

                {/* Navigation Header - Minimal */}
                <View className="h-12 justify-center">
                    {mode !== "landing" && (
                        <Pressable
                            onPress={() => {
                                setMode(mode === "otp" ? "email" : "landing");
                                if (mode === "otp") setResendTimer(0);
                            }}
                            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center active:bg-gray-100"
                        >
                            <Ionicons name="arrow-back" size={20} color="black" />
                        </Pressable>
                    )}
                </View>

                {/* Main Hero Block */}
                <View className="flex-1 items-center justify-center">
                    {/* Brand Identity */}
                    <Animated.View entering={FadeIn.duration(600)} className="items-center mb-10">
                        <View className="w-24 h-24 items-center justify-center mb-6 overflow-hidden">
                            <Image
                                source={require('../assets/logo_premium.jpg')}
                                style={{ width: '100%', height: '100%', borderRadius: 20 }}
                                resizeMode="cover"
                            />
                        </View>
                        <Text className="text-3xl font-black text-gray-900 tracking-tighter">DailyXpense</Text>

                        {mode !== "landing" && (
                            <View className="mt-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                                <Text className="text-blue-600 font-bold text-[8px] tracking-widest uppercase">
                                    {mode === "email" ? "Authentication" : "Verification"}
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Dynamic Interaction Area */}
                    <View className="w-full">
                        {mode === "landing" && (
                            <Animated.View entering={FadeIn.duration(500)} className="items-center">
                                <Text className="text-5xl font-black text-gray-900 leading-[1.1] tracking-tight text-center mb-6">
                                    Your money,{"\n"}
                                    <Text className="text-blue-600">mastered.</Text>
                                </Text>
                                <Text className="text-gray-400 text-lg leading-6 text-center px-4">
                                    The institutional way to manage personal wealth with effortless style.
                                </Text>
                            </Animated.View>
                        )}

                        {mode === "email" && (
                            <Animated.View entering={FadeIn.duration(400)}>
                                <Text className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Login Email</Text>
                                <Text className="text-gray-400 text-base mb-8">We'll send a 6-digit code to your inbox.</Text>

                                <View className="border-b-2 border-gray-200 pb-2">
                                    <TextInput
                                        className="text-2xl font-semibold text-gray-900 h-12"
                                        placeholder="name@example.com"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (emailError) setEmailError("");
                                        }}
                                        autoFocus
                                        onSubmitEditing={() => handleSendOtp(false)}
                                        returnKeyType="go"
                                    />
                                </View>
                                {emailError ? (
                                    <Text className="text-red-500 text-sm mt-6 font-bold">{emailError}</Text>
                                ) : null}
                            </Animated.View>
                        )}

                        {mode === "otp" && (
                            <Animated.View entering={FadeIn.duration(400)}>
                                <Text className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Check Email</Text>
                                <Text className="text-gray-400 text-base mb-8">Verification code sent to <Text className="text-gray-900 font-bold">{email}</Text></Text>

                                <View className="flex-row justify-between relative h-16">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <View
                                            key={i}
                                            className={`w-[45px] h-14 border-b-2 items-center justify-center ${otp.length === i ? 'border-blue-600' : 'border-gray-100'}`}
                                        >
                                            <Text className="text-3xl font-black text-gray-900 italic">
                                                {otp[i] || ""}
                                            </Text>
                                        </View>
                                    ))}
                                    <TextInput
                                        className="absolute inset-0 opacity-0 w-full h-full"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={otp}
                                        onChangeText={setOtp}
                                        autoFocus
                                        textContentType="oneTimeCode"
                                        autoComplete="sms-otp"
                                    />
                                </View>

                                <View className="mt-8">
                                    {resendTimer > 0 ? (
                                        <Text className="text-gray-400 font-bold text-xs tracking-widest uppercase">Valid for {resendTimer}s</Text>
                                    ) : (
                                        <Pressable onPress={() => handleSendOtp(true)}>
                                            <Text className="text-blue-600 font-black text-xs uppercase tracking-widest">Resend Code</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </Animated.View>
                        )}
                    </View>
                </View>

                {/* Footer / Action Area */}
                <View className="space-y-4">
                    {mode === "landing" ? (
                        <View className="gap-4">
                            <Pressable
                                onPress={() => setMode("email")}
                                className="w-full bg-blue-600 h-16 rounded-2xl flex-row items-center justify-center shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all"
                            >
                                <Text className="font-bold text-white text-xl">Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                            </Pressable>

                            <View className="w-full h-16 border border-gray-100 rounded-2xl flex-row items-center justify-center opacity-40">
                                <Ionicons name="logo-google" size={20} color="black" style={{ marginRight: 12 }} />
                                <Text className="font-bold text-gray-600 text-lg">Google Sign-In</Text>
                                <View className="ml-3 bg-gray-100 px-2 py-0.5 rounded-md">
                                    <Text className="text-[8px] font-black text-gray-400 tracking-tighter">SOON</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Pressable
                            onPress={mode === "email" ? () => handleSendOtp(false) : handleVerifyOtp}
                            disabled={loading}
                            className={`w-full bg-blue-600 h-16 rounded-2xl items-center justify-center shadow-xl shadow-blue-500/30 active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="font-bold text-white text-xl">
                                    {mode === "email" ? "Send Code" : "Verify & Enter"}
                                </Text>
                            )}
                        </Pressable>
                    )}

                    {/* Toast Integration */}
                    {sendSuccess && (
                        <Animated.View entering={FadeIn} exiting={FadeOut} className="absolute -top-32 left-0 right-0 items-center">
                            <View className="bg-emerald-500 px-6 py-3 rounded-full shadow-lg flex-row items-center">
                                <Ionicons name="checkmark-circle" size={18} color="white" />
                                <Text className="text-white font-bold ml-2">Secure code sent!</Text>
                            </View>
                        </Animated.View>
                    )}

                    <View className="mt-8 items-center">
                        <Text className="text-[10px] text-gray-300 font-bold tracking-[0.4em] uppercase">DailyXpense Enterprise Edition</Text>
                    </View>
                </View>

            </View>
        </View>
    );
}
