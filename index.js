import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Suppress specific warnings/errors
// 'SafeAreaView' is from third-party libs (gifted-charts)
// 'expo-notifications' is because we import the module for local notifications in Expo Go, which triggers a push-token warning.
LogBox.ignoreLogs([
    'SafeAreaView has been deprecated',
    'expo-notifications: Android Push notifications',
    'Value being stored in SecureStore is larger than 2048 bytes',
    '[Reanimated] Reading from `value` during component render',
    '[Reanimated] Writing to `value` during component render',
]);

import 'expo-router/entry';
