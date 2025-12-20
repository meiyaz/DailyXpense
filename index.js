import { LogBox } from 'react-native';

// Suppress specific warnings/errors
// 'SafeAreaView' is from third-party libs (gifted-charts)
// 'expo-notifications' is because we import the module for local notifications in Expo Go, which triggers a push-token warning.
LogBox.ignoreLogs([
    'SafeAreaView has been deprecated',
    'expo-notifications: Android Push notifications',
]);

import 'expo-router/entry';
