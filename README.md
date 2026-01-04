# DailyXpense - Your Money, Mastered.

**DailyXpense** is a premium personal finance application designed to help you track expenses, manage budgets, and secure your financial data with institutional-grade privacy. Built with an "offline-first" architecture, it ensures your data is always available, syncing seamlessly to the cloud when you're back online.

## Key Features

### Premium Experience
- **Smart Expense Tracking**: valid, categorized logging of your daily spends.
- **Beautiful UI**: A clean, modern interface with dark/light mode support.
- **Customizable**: Personalize your profile, categories, and currency settings.

### Security First
- **App Lock**: Secure your financial data with a 4-digit PIN.
- **Biometric Authentication**: Seamless login using FaceID or Fingerprint (on supported devices).
- **Privacy Focused**: Your data belongs to you.

### Robust Architecture
- **Offline-First**: Add expenses anywhere, anytime. Data syncs automatically when connection is restored.
- **Cloud Sync**: Powered by Supabase to keep your data consistent across devices.
- **Cross-Platform**: A unified experience on Android, iOS, and Web.

## Technology Stack

DailyXpense is built using the latest modern web and mobile technologies:

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (Managed Workflow)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type-safe code.
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native).
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing).
- **Database (Local)**: SQLite via [Drizzle ORM](https://orm.drizzle.team/).
- **Database (Cloud)**: [Supabase](https://supabase.com/) (PostgreSQL).
- **Authentication**: Supabase Auth (OTP & Magic Link).

## Getting Started

### Prerequisites
- Node.js (LTS)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dailyxpense.git
   cd dailyxpense
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
    Create a `.env` file in the root directory with your Supabase credentials:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4. **Run the App**
   ```bash
   npx expo start
   ```
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator
   - Press `w` for Web
   - Scan the QR code with Expo Go to run on a physical device.

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
