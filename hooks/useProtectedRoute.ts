import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '../store/AuthContext';

export function useProtectedRoute() {
    const segments = useSegments();
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        const isNavigationReady = rootNavigationState?.key;

        if (!isNavigationReady || isLoading) return;

        // Use setTimeout to push navigation to next tick, avoiding "navigate before mount" error
        const timer = setTimeout(() => {
            const inLoginGroup = segments[0] === 'login';

            if (!isAuthenticated && !inLoginGroup) {
                router.replace('/login');
            } else if (isAuthenticated && inLoginGroup) {
                router.replace('/');
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [isAuthenticated, isLoading, segments, rootNavigationState?.key]);
}
