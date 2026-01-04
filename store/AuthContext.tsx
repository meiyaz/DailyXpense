import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: SupabaseUser | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sendOtp: (email: string) => Promise<{ error: any }>;
    verifyOtp: (email: string, token: string) => Promise<{ error: any; session: Session | null }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("Error restoring session:", error.message);
                // If session is invalid, ensure we start clean
            }
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        }).catch((err) => {
            console.error("Unexpected error restoring session:", err);
            setIsLoading(false);
        });



        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event as string === 'TOKEN_REFRESH_FAILED') {
                console.log("Token refresh failed, forcing sign out.");
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
            } else {
                setSession(session);
                setUser(session?.user ?? null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const sendOtp = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
        });
        return { error };
    };

    const verifyOtp = async (email: string, token: string) => {

        const { data, error: emailError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (!emailError && data.session) {
            return { error: null, session: data.session };
        }

        // Try 'signup' fallback
        const { data: signupData, error: signupError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (!signupError && signupData.session) {
            return { error: null, session: signupData.session };
        }

        const isSignupRelevant = emailError?.message?.includes("not found") || emailError?.message?.includes("Signups not allowed");

        if (isSignupRelevant) {
            return { error: signupError || emailError, session: null };
        }
        return { error: emailError || signupError, session: null };
    };

    const signInWithGoogle = async () => {
        try {
            const redirectUrl = makeRedirectUri({
                scheme: 'dailyxpense',
                path: 'auth/callback',
            });


            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: false,
                },
            });

            if (error) return { error };

            if (Platform.OS !== 'web' && data.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (result.type !== 'success') {
                    return { error: { message: "Sign in canceled" } };
                }
            }

            return { error: null };
        } catch (e: any) {
            console.error("Google Signin Error", e);
            return { error: e };
        }
    };


    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isAuthenticated: !!user,
                isLoading,
                sendOtp,
                verifyOtp,
                signInWithGoogle,
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
