# Platform-Aware Test Suite

The Jest test suite now supports both Android and iOS platforms with concurrent execution capabilities.

## Features

- ✅ **Platform-Aware**: All tests work on both Android and iOS
- ✅ **Concurrent Execution**: Run tests on multiple platforms simultaneously
- ✅ **Automatic Device Management**: Handles emulator/simulator booting and switching
- ✅ **iOS Pod Support**: Automatically runs `bundle install` for iOS tests in `beforeAll()`
- ✅ **Flexible Execution**: Run individual tests or full suite for specific platforms

## Usage

### Running Tests

#### Default (Both Platforms)
```bash
npm test
# or
yarn test
```

#### Android Only
```bash
npm run test:android
# or
TEST_PLATFORMS=android npm test
```

#### iOS Only
```bash
npm run test:ios
# or
TEST_PLATFORMS=ios npm test
```

#### Both Platforms Explicitly
```bash
npm run test:both
# or
TEST_PLATFORMS=android,ios npm test
```

### Running Specific Test Suites

```bash
# Full bundle tests only
npm run test:fullbundle

# Patch bundle tests only
npm run test:patchbundle
```

## How It Works

### Platform Detection

Tests read the platform from the `TEST_PLATFORMS` environment variable:
- Default: `['android', 'ios']` (runs for both)
- Set via: `TEST_PLATFORMS=android` or `TEST_PLATFORMS=ios` or `TEST_PLATFORMS=android,ios`

### Test Structure

Each test suite (`fullbundle` and `patchbundle`) loops through the specified platforms and runs all tests for each platform:

```javascript
TEST_PLATFORMS.forEach(platform => {
  describe(`fullbundle [${platform}]`, () => {
    // All tests run for this platform
  });
});
```

### Platform-Specific Configuration

The `automate.mjs` module provides platform configurations:

- **Android**:
  - Bundle directory: `.dota/android`
  - Bundle file: `index.android.bundle`
  - Build command: `yarn android --mode=Release`
  - Uninstall: `adb uninstall <appId>`

- **iOS**:
  - Bundle directory: `.dota/ios`
  - Bundle file: `main.jsbundle`
  - Build command: `yarn ios --mode Release`
  - Uninstall: `xcrun simctl uninstall <deviceId> <appId>`

### iOS Setup

The `beforeAll()` hook automatically:
1. Checks if iOS is in `TEST_PLATFORMS`
2. Runs `bundle install` if `Gemfile` exists
3. Ensures iOS simulator is available/booted

### UI Automation Files

Maestro YAML files are platform-aware:
- Android: `ui-automation.yaml`, `ui-automation-assets.yaml`, `ui-automation-corrupted.yaml`
- iOS: `ui-automation-ios.yaml`, `ui-automation-assets-ios.yaml`, `ui-automation-corrupted-ios.yaml`

The `runMaestroTest()` function automatically selects the correct YAML file based on the platform.

## Prerequisites

### Android
- Android SDK installed
- Android emulator created and available
- `adb` in PATH

### iOS
- Xcode installed
- CocoaPods installed (`gem install cocoapods`)
- `Gemfile` in project root (for bundle install)
- iOS Simulator available

## Test Execution Flow

1. **Platform Detection**: Reads `TEST_PLATFORMS` environment variable
2. **Module Loading**: Loads `automate.mjs` utilities
3. **iOS Setup**: Runs `bundle install` if iOS is in platforms
4. **Platform Loop**: For each platform:
   - Sets platform context
   - Ensures device is ready
   - Runs all tests
   - Cleans up after each test
5. **Cleanup**: Removes test artifacts and uninstalls app

## Environment Variables

- `TEST_PLATFORMS`: Comma-separated list of platforms (e.g., `android,ios`, `android`, `ios`)
- `ANDROID_EMU`: Specific Android emulator name (optional)
- `IOS_EMU`: Specific iOS simulator device ID (optional)

## Notes

- Tests run sequentially within each platform to avoid conflicts
- Platforms run in the order specified in `TEST_PLATFORMS`
- iOS requires `bundle install` which is handled automatically in `beforeAll()`
- All test artifacts are cleaned up after execution
- Event flow verification is Android-specific (uses logcat); iOS can be extended with device logs

