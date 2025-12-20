import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../store/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useProtectedRoute } from "../hooks/useProtectedRoute";

export default function Login() {
    const { signIn } = useAuth();
    const [mode, setMode] = useState<"initial" | "email" | "otp">("initial");
    const [email, setEmail] = useState("");


    const router = useRouter();
    const [otp, setOtp] = useState("");
    useProtectedRoute();

    const handleSendOtp = () => {
        if (!email.includes("@")) {
            alert("Please enter a valid email");
            return;
        }
        // Mock sending OTP
        console.log("OTP sent to", email);
        alert("OTP sent! (Use 123456)");
        setMode("otp");
    };

    const handleVerifyOtp = () => {
        if (otp === "123456") {
            signIn("email", email);
        } else {
            alert("Invalid OTP");
        }
    };

    if (mode === "otp") {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="w-full max-w-sm">
                    <Pressable onPress={() => setMode("email")} className="mb-8 self-start">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </Pressable>

                    <Text className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</Text>
                    <Text className="text-gray-500 mb-8">We sent a 6-digit code to {email}</Text>

                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xl font-bold tracking-widest text-center mb-6"
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        autoFocus
                    />

                    <Pressable
                        onPress={handleVerifyOtp}
                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700"
                    >
                        <Text className="font-bold text-white text-lg">Verify</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    if (mode === "email") {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="w-full max-w-sm">
                    <Pressable onPress={() => setMode("initial")} className="mb-8 self-start">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </Pressable>

                    <Text className="text-2xl font-bold text-gray-900 mb-2">What's your email?</Text>
                    <Text className="text-gray-500 mb-8">We'll verify it with a code.</Text>

                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg text-gray-900 mb-6"
                        placeholder="name@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        autoFocus
                    />

                    <Pressable
                        onPress={handleSendOtp}
                        className="w-full bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700"
                    >
                        <Text className="font-bold text-white text-lg">Continue</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="mb-12 items-center">
                <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-blue-200">
                    <Ionicons name="wallet-outline" size={40} color="white" />
                </View>
                <Text className="text-3xl font-bold text-gray-800">DailyXpense</Text>
                <Text className="text-gray-500 mt-2 text-center">Track your spending, master your budget.</Text>
            </View>

            <View className="w-full gap-4">
                {/* Email Button */}
                <Pressable
                    onPress={() => setMode("email")}
                    className="flex-row items-center justify-center bg-blue-600 p-4 rounded-xl active:bg-blue-700 mb-2"
                >
                    <Ionicons name="mail" size={24} color="white" />
                    <Text className="font-semibold text-white ml-3 text-lg">Continue with Email</Text>
                </Pressable>

                {/* Google Button */}
                <Pressable
                    onPress={() => signIn("google")}
                    className="flex-row items-center justify-center bg-white border border-gray-300 p-4 rounded-xl active:bg-gray-50"
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text className="font-semibold text-gray-700 ml-3 text-lg">Continue with Google</Text>
                </Pressable>


                {/* Terms Text */}
                <Text className="text-xs text-center text-gray-400 mt-2 px-8">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
            </View>

            <View className="absolute bottom-8 items-center w-full">
                <Text className="text-xs text-center text-gray-400">Developed with ❤️ by Mei</Text>
            </View>
        </View>
    );
}
