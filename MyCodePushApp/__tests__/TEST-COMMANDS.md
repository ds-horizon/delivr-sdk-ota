# Test Commands Reference

## Test Statistics

- **Total Test Cases**: 12
- **Test Suites**: 2 (fullbundle, patchbundle)
- **Platforms Supported**: Android, iOS
- **Total Test Executions** (when running both platforms): 12 × 2 = **24 test executions**

## Test Structure

Each test case runs for each platform specified in `TEST_PLATFORMS`:
- `fullbundle` suite: 6 tests × platforms
- `patchbundle` suite: 6 tests × platforms

## Commands to Run Tests

### Run All Tests (Both Platforms - Default)
```bash
npm test
# or
npm run test:both
# or explicitly
TEST_PLATFORMS=android,ios npm test
```

### Run Tests for Android Only
```bash
npm run test:android
# or
TEST_PLATFORMS=android npm test
```

### Run Tests for iOS Only
```bash
npm run test:ios
# or
TEST_PLATFORMS=ios npm test
```

### Run Specific Test Suite

#### Full Bundle Tests Only
```bash
npm run test:fullbundle
# With platform filter:
TEST_PLATFORMS=android npm run test:fullbundle
TEST_PLATFORMS=ios npm run test:fullbundle
```

#### Patch Bundle Tests Only
```bash
npm run test:patchbundle
# With platform filter:
TEST_PLATFORMS=android npm run test:patchbundle
TEST_PLATFORMS=ios npm run test:patchbundle
```

### Run Tests with Specific Pattern
```bash
# Run tests matching a pattern
npm test -- --testNamePattern="should deploy and verify full bundle with default settings"

# With platform filter
TEST_PLATFORMS=android npm test -- --testNamePattern="default settings"
```

### Other Useful Commands

#### Watch Mode
```bash
npm run test:watch
```

#### Verbose Output
```bash
npm run test:verbose
```

#### Coverage Report
```bash
npm run test:coverage
```

## Test Cases Breakdown

### Full Bundle Tests (6 tests)
1. `should deploy and verify full bundle with default settings`
2. `should deploy and verify full bundle with Brotli compression`
3. `should deploy and verify full bundle with corrupted bundle handling`
4. `should deploy and verify full bundle with assets`
5. `should deploy and verify full bundle with event flow`
6. `should deploy and verify full bundle with custom description`

### Patch Bundle Tests (6 tests)
1. `should deploy and verify patch bundle with default settings`
2. `should deploy and verify patch bundle with Brotli compression`
3. `should deploy and verify patch bundle with corrupted bundle handling`
4. `should deploy and verify patch bundle with assets`
5. `should deploy and verify patch bundle with event flow`
6. `should deploy and verify patch bundle with custom description`

## Platform-Specific Details

### Android
- Bundle directory: `.dota/android`
- Bundle file: `index.android.bundle`
- Build command: `yarn android --mode=Release`
- Uninstall: `adb uninstall <appId>`

### iOS
- Bundle directory: `.dota/ios`
- Bundle file: `main.jsbundle`
- Build command: `yarn ios --mode Release`
- Uninstall: `xcrun simctl uninstall <deviceId> <appId>`

## Notes

- All UI automation YAML files are now platform-agnostic and use a single file per test type
- The platform is automatically passed as an argument to Maestro tests
- iOS setup (bundle install) runs automatically in `beforeAll()` when iOS is in test platforms
- Each test has a 10-minute timeout (600000ms) to accommodate build and deployment processes

