# iOS CodePush Logging Guide

## Overview
Unlike Android Studio which provides a built-in logcat viewer, iOS requires using command-line tools to view CodePush logs.

## Methods to View iOS Logs

### 1. Real-time Log Stream (Recommended)
View logs in real-time for the booted simulator:

```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "MyCodePushApp"'
```

Or view all logs (not filtered):
```bash
xcrun simctl spawn booted log stream
```

### 2. Filtered Log Stream (CodePush-specific)
View only CodePush-related logs:

```bash
xcrun simctl spawn booted log stream --predicate 'subsystem contains "CodePush" OR messageText contains "CodePush" OR messageText contains "DOTA"'
```

### 3. Historical Logs
View recent logs from the simulator:

```bash
xcrun simctl spawn booted log show --last 5m --predicate 'processImagePath contains "MyCodePushApp"'
```

### 4. Using Console.app (macOS GUI)
1. Open **Console.app** (Applications > Utilities > Console)
2. Select your simulator device from the sidebar
3. Filter by process name: `MyCodePushApp`
4. Search for "CodePush" or "DOTA" in the search bar

### 5. During Test Execution
To view logs while running tests, open a separate terminal and run:

```bash
# Get the device ID first
xcrun simctl list devices booted | grep Booted

# Then stream logs (replace DEVICE_ID with actual ID)
xcrun simctl spawn <DEVICE_ID> log stream --predicate 'processImagePath contains "MyCodePushApp"'
```

Or use the booted device directly:
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "MyCodePushApp"'
```

## Common CodePush Log Patterns

### Successful Update
Look for messages like:
- `CodePush: Update installed successfully`
- `DOTA Updated bundle loaded successfully`
- `CodePush: Bundle URL updated`

### Update Check
- `CodePush: Checking for update`
- `CodePush: Update available`
- `CodePush: No update available`

### Errors
- `CodePush: Failed to install update`
- `CodePush: Rollback triggered`
- `CodePush: Bundle load error`

## Tips

1. **Keep logs running in a separate terminal** while running tests to see real-time CodePush activity
2. **Use predicates** to filter logs and reduce noise
3. **Check both simulator logs and Xcode console** if debugging native code issues
4. **Use `--last` flag** to view recent logs if you missed something

## Example: Watch CodePush Activity During Tests

```bash
# Terminal 1: Run tests
cd /Users/harshavardhanithota/Downloads/delivr-sdk-ota/MyCodePushApp
TEST_PLATFORMS=ios npm test -- --testNamePattern="patchbundle"

# Terminal 2: Watch logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "MyCodePushApp" AND (messageText contains "CodePush" OR messageText contains "DOTA")'
```

