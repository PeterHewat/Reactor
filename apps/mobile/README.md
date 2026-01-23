# Mobile App (React Native CLI)

React Native mobile application for iOS and Android. This is a **scaffold directory** - you'll run the React Native CLI to generate the actual app.

## Prerequisites

### macOS (for iOS development)

1. **Xcode** (from App Store)
   - Open Xcode and install additional components when prompted
   - Install Command Line Tools: `xcode-select --install`

2. **CocoaPods**

   ```bash
   sudo gem install cocoapods
   ```

3. **iOS Simulator**
   - Open Xcode > Settings > Platforms > Download iOS Simulator

### All Platforms (for Android development)

1. **Java Development Kit (JDK 17)**

   ```bash
   # macOS with Homebrew
   brew install openjdk@17

   # Add to PATH
   echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
   ```

2. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK, Android SDK Platform, Android Virtual Device
   - Configure `ANDROID_HOME` environment variable

3. **Watchman** (recommended)
   ```bash
   brew install watchman
   ```

## Setup Instructions

### 1. Initialize React Native Project

From the `apps/mobile` directory, initialize the React Native project in place:

```bash
cd apps/mobile

# Initialize React Native in the current directory
# The CLI will create the project structure alongside existing files
npx @react-native-community/cli init ReactorMobile --template react-native-template-typescript

# Move generated files to current directory and clean up
mv ReactorMobile/* . 2>/dev/null || true
mv ReactorMobile/.* . 2>/dev/null || true
rm -rf ReactorMobile

# The existing package.json already has workspace dependencies configured
# Merge React Native dependencies into it (see step 2)
```

### 2. Merge Package Dependencies

The existing `package.json` already has the workspace name and dependencies. After initialization, merge the React Native dependencies:

```bash
# Install React Native dependencies (these will be added by the CLI)
npm install react-native

# The workspace dependencies are already configured:
# "@repo/ui-mobile", "@repo/ui-shared", "@repo/utils"
```

### 3. Configure Metro for Monorepo

Create or update `apps/mobile/metro.config.js`:

```js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(monorepoRoot, "node_modules"),
    ],
    extraNodeModules: {
      "@repo/ui-mobile": path.resolve(monorepoRoot, "packages/ui-mobile"),
      "@repo/ui-shared": path.resolve(monorepoRoot, "packages/ui-shared"),
      "@repo/utils": path.resolve(monorepoRoot, "packages/utils"),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
```

### 4. Install NativeWind

```bash
cd apps/mobile
npm install nativewind
npm install -D tailwindcss@^3.4.0
```

Create `apps/mobile/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui-mobile/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
    },
  },
  plugins: [],
};
```

Update `apps/mobile/babel.config.js`:

```js
module.exports = {
  presets: ["module:@react-native/babel-preset", "nativewind/babel"],
};
```

### 5. Install Clerk (Authentication)

```bash
npm install @clerk/clerk-expo
```

Configure in your app entry:

```tsx
import { ClerkProvider } from "@clerk/clerk-expo";

export default function App() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {/* Your app */}
    </ClerkProvider>
  );
}
```

### 6. Install Convex (Backend)

```bash
npm install convex
```

Configure the Convex client:

```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.CONVEX_URL!);

export default function App() {
  return <ConvexProvider client={convex}>{/* Your app */}</ConvexProvider>;
}
```

### 7. Install React Navigation

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

For iOS:

```bash
cd ios && pod install && cd ..
```

## Running the App

### iOS

```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios

# Or specify a simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

## Project Structure

After setup, your mobile app structure should look like:

```
apps/mobile/
├── android/              # Android native code
├── ios/                  # iOS native code
├── src/
│   ├── components/       # App-specific components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── hooks/            # Custom hooks
│   └── utils/            # App utilities
├── App.tsx               # App entry point
├── metro.config.js       # Metro bundler config
├── tailwind.config.js    # NativeWind config
├── babel.config.js       # Babel config
└── package.json
```

## Testing

### Unit Tests (Vitest + React Native Testing Library)

```bash
npm install -D vitest @testing-library/react-native
```

### E2E Tests (Detox)

```bash
# Install Detox CLI globally
npm install -g detox-cli

# Install Detox in project
npm install -D detox

# Initialize Detox
detox init
```

## Development Workflow

### Scripts to Add

Update `apps/mobile/package.json`:

```json
{
  "scripts": {
    "start": "react-native start",
    "ios": "react-native run-ios",
    "android": "react-native run-android",
    "test": "vitest run",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Hot Reloading

React Native supports Fast Refresh out of the box. Changes to JavaScript/TypeScript code will automatically reload.

### Debugging

- **React Native Debugger**: Standalone app for debugging
- **Flipper**: Facebook's mobile debugging platform
- **Chrome DevTools**: Connect via `npx react-devtools`

## Shared Code Usage

### Using UI Components

```tsx
import { Button } from "@repo/ui-mobile";

function MyScreen() {
  return (
    <Button variant="primary" onPress={() => {}}>
      Press Me
    </Button>
  );
}
```

### Using Design Tokens

```tsx
import { colors, spacing } from "@repo/ui-shared";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    padding: spacing[4], // 16
  },
});
```

### Using Utilities

```tsx
import { useThemeStore } from "@repo/utils";

function ThemeToggle() {
  const { mode, setMode } = useThemeStore();
  // Note: Mobile uses Appearance API, not DOM classes
}
```

## Platform-Specific Code

### iOS vs Android

```tsx
import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 44 : 0,
  },
});
```

### Platform-Specific Files

Create platform-specific versions:

- `Component.ios.tsx` - iOS only
- `Component.android.tsx` - Android only
- `Component.tsx` - Shared/fallback

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear watchman
watchman watch-del-all
```

### iOS Build Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
```

### Monorepo Resolution Issues

If packages aren't resolving:

1. Check `metro.config.js` has correct paths
2. Run `npm install` from repository root
3. Restart Metro bundler with cache clear

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Clerk React Native](https://clerk.com/docs/quickstarts/react-native)
- [Convex React Native](https://docs.convex.dev/client/react)
