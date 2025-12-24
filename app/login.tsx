import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, ImageBackground, Keyboard } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../store/AuthContext";
import { Stack } from "expo-router";

export default function Login() {
    const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();
    const [mode, setMode] = useState<"landing" | "email" | "otp">("landing");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        if (resendTimer === 0) return;

        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer === 0]);

    const handleSendOtp = async (isResend = false) => {
        const cleanEmail = email.trim().toLowerCase();
        Keyboard.dismiss();

        if (!cleanEmail.includes("@")) {
            Alert.alert("Error", "Please enter a valid email");
            return;
        }

        if (resendTimer > 0 && !isResend) {
            return;
        }

        setLoading(true);
        try {
            const { error } = await sendOtp(cleanEmail);
            if (error) {
                Alert.alert("Error", error.message);
            } else {
                if (!isResend) setMode("otp");
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
        <ImageBackground
            source={require('../assets/images/ledger_bg.png')}
            className="flex-1 items-center justify-center p-6"
            resizeMode="cover"
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* OTP Mode */}
            {mode === "otp" && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    className="w-full max-w-sm bg-white/90 p-6 rounded-3xl shadow-xl backdrop-blur-xl"
                >
                    <Pressable onPress={() => setMode("email")} className="mb-6 self-start">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </Pressable>

                    <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
                    <Text className="text-gray-500 mb-8">We've sent a code to <Text className="font-bold text-gray-800">{email}</Text>.</Text>

                    <View>
                        <Text className="text-gray-700 font-medium mb-2 ml-1">Confirmation Code</Text>
                        <View className="flex-row justify-between mb-2 relative h-14">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <View
                                    key={i}
                                    className={`w-12 h-14 border rounded-xl items-center justify-center bg-gray-50 ${otp.length === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                >
                                    <Text className="text-xl font-bold text-gray-900">
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
                    </View>

                    <Pressable
                        onPress={handleVerifyOtp}
                        disabled={loading}
                        className={`w-full bg-blue-600 p-4 rounded-xl items-center mt-6 active:bg-blue-700 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="font-bold text-white text-lg">Verify Code</Text>
                        )}
                    </Pressable>

                    <View className="mt-6 items-center">
                        {resendTimer > 0 ? (
                            <Text className="text-gray-600 font-medium">Resend code in {resendTimer}s</Text>
                        ) : (
                            <Pressable onPress={() => handleSendOtp(true)} disabled={loading}>
                                <Text className="text-blue-600 font-medium text-lg">Resend Code</Text>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>
            )}

            {/* Email Mode */}
            {mode === "email" && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    className="w-full max-w-sm bg-white/90 p-6 rounded-3xl shadow-xl backdrop-blur-xl"
                >
                    <Pressable onPress={() => setMode("landing")} className="mb-6 self-start">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </Pressable>

                    <Text className="text-2xl font-bold text-gray-900 mb-2">What's your email?</Text>
                    <Text className="text-gray-500 mb-8">We'll send you a magic link to sign in.</Text>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1 ml-1">Email</Text>
                        <TextInput
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-900"
                            placeholder="name@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            autoFocus
                            onSubmitEditing={() => handleSendOtp(false)}
                            returnKeyType="go"
                        />
                    </View>

                    <Pressable
                        onPress={() => handleSendOtp(false)}
                        disabled={loading}
                        className={`w-full bg-blue-600 p-4 rounded-xl items-center mt-6 active:bg-blue-700 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="font-bold text-white text-lg">Send Code</Text>
                        )}
                    </Pressable>
                </Animated.View>
            )}

            {/* Landing Mode */}
            {mode === "landing" && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    className="w-full max-w-sm items-center"
                >
                    <View className="mb-12 items-center bg-white/80 p-6 rounded-3xl shadow-sm backdrop-blur-md w-full">
                        <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-blue-200">
                            <Ionicons name="wallet-outline" size={40} color="white" />
                        </View>
                        <Text className="text-3xl font-bold text-gray-800">DailyXpense</Text>
                        <Text className="text-gray-500 mt-2 text-center">Track your spending, master your budget.</Text>
                    </View>

                    <View className="w-full max-w-sm gap-4">
                        <Pressable
                            onPress={() => Alert.alert("Coming Soon", "Google Sign-In is currently under development.")}
                            className="w-full bg-white border border-gray-200 p-4 rounded-xl flex-row items-center justify-center active:bg-gray-50 shadow-sm opacity-60"
                        >
                            <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 12 }} />
                            <Text className="font-bold text-gray-500 text-lg">Sign in with Google (Coming Soon)</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setMode("email")}
                            className="w-full bg-gray-100 p-4 rounded-xl flex-row items-center justify-center active:bg-gray-200"
                        >
                            <Ionicons name="mail-outline" size={20} color="#374151" style={{ marginRight: 12 }} />
                            <Text className="font-bold text-gray-700 text-lg">Continue with Email</Text>
                        </Pressable>
                    </View>

                    <View className="absolute -bottom-20 items-center w-full">
                        <Text className="text-xs text-center text-gray-400">Developed with ❤️ by Mei</Text>
                    </View>
                </Animated.View>
            )}
        </ImageBackground>
    );
}
