# DailyXpense - Your Money, Mastered. 💎

**DailyXpense** is a premium personal finance application designed to help you track expenses, manage budgets, and secure your financial data with institutional-grade privacy. Built with an "offline-first" architecture, it ensures your data is always available, syncing seamlessly to the cloud with unparalleled reliability.

---

## ✨ Key Features

### 💎 The Premium Experience
- **Immersive Onboarding**: A curated "tour" for new users to set up their identity, security, and preferences with ease.
- **Welcome Back Flow**: Personalized greetings and sound integration for a warm start to your financial review.
- **Smart Expense Tracking**: Lightning-fast, categorized logging with real-time feedback.
- **Spend Review Pro**: (Premium) Advanced AI-driven insights and visual intelligence to decode your spending habits.
- **Premium Exports**: (Premium) Generate clean, tax-ready PDF and Excel reports in seconds.

### 🛡️ Institutional Security
- **Vault Security**: Protect your financial secrets with a private 4-digit PIN.
- **Biometric Authentication**: Access your data instantly using FaceID or Fingerprint (on supported hardware).
- **Bulletproof Transitions**: Rock-solid login and logout flows with stabilized navigation protection.

### ☁️ Robust Architecture
- **Offline-First**: Add expenses anywhere, anytime—even in a tunnel. Data syncs automatically once you're back on the grid.
- **Instant Cloud Sync**: (Premium) Powered by Supabase to keep your data perfectly consistent across all your devices.
- **Zen Design Philosophy**: A minimal, glassmorphic UI that scales beautifully from mobile screens to the web.

---

## 🛠️ Technology Stack

DailyXpense leverages the absolute cutting edge of the Expo ecosystem:

- **Core**: [React Native](https://reactnative.dev/) + [Expo SDK 54+](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based, nested modal support)
- **Database (Local)**: SQLite via [Drizzle ORM](https://orm.drizzle.team/)
- **Database (Cloud)**: [Supabase](https://supabase.com/) (PostgreSQL + RLS Security)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Security**: [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/secure-store/) + [Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- npm or yarn
- Expo Go app on your mobile device (optional, for physical testing)

### Installation

1. **Clone & Enter**
   ```bash
   git clone https://github.com/yourusername/dailyxpense.git
   cd dailyxpense
   ```

2. **Bootstrap Dependencies**
   ```bash
   npm install
   ```

3. **Cloud Configuration**
    Create a `.env` file in the root directory for standard Supabase integration:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4. **Launch the Experience**
   ```bash
   npx expo start --clear
   ```
   - Press `a` (Android), `i` (iOS), or `w` (Web) to see the app in action.

---

## 🤝 Contribution

We're building the future of personal finance. Contributions, issues, and feature requests are welcome!

## 📜 License

This project is licensed under the MIT License.
