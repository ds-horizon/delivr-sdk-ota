# React Native Module for OTA Updates

Instantly deliver JS and asset updates to your React Native apps. Know more about [OTA Updates](docs/ota-updates.md)
<!-- React Native Catalog -->

* [Getting Started](#getting-started)
    * [iOS Setup](docs/setup-ios.md)
    * [Android Setup](docs/setup-android.md)
* [Usage](#usage)
* [Creating the JavaScript bundle](#creating-the-javascript-bundle-hermes)
* [Releasing Updates](#releasing-updates)
* [Debugging / Troubleshooting](#debugging--troubleshooting)
* [Advanced Topics](#advanced-topics)
  * [Store Guideline Compliance](docs/store*guidelines.md)
  * [Multi-Deployment Testing](docs/multi-deployment-testing.md)
  * [Dynamic Deployment Assignment](docs/dynamic-deployment-assignment.md)
  * [Supported Components](docs/supported-components.md)
* [API Reference](#api-reference)
    * [JavaScript API](docs/api-js.md)
    * [Objective-C API Reference (iOS)](docs/api-ios.md)
    * [Swift API Reference (iOS)](docs/api-ios-swift.md)
    * [Java API Reference (Android)](docs/api-android.md)
* [TypeScript Consumption](#typescript-consumption)

<!-- React Native Catalog -->

## Getting Started

You can add [DOTA](docs/ota-updates.md) to your React Native app by running the following command from within your app's root directory:

* Yarn
```shell
yarn add @d11/dota
```
* NPM
```shell
npm install @d11/dota
```

As with all other React Native plugins, the integration experience is different for iOS and Android, so perform the following setup steps depending on which platform(s) you are targeting. Note, if you are targeting both platforms it is recommended to create separate DOTA applications for each platform through DOTA dashboard.

Then continue with installing the native module
  * [iOS Setup](docs/setup-ios.md)
  * [Android Setup](docs/setup-android.md)

## Usage

The only thing left is to add the necessary code to your app to control the following policies:

1. When (and how often) to check for an update? (for example app start, in response to clicking a button in a settings page, periodically at some fixed interval)

2. When an update is available, how to present it to the end user?

The simplest way to get started:

* Wrap your root component with the `codePush`:

  ```javascript
  import codePush from "@d11/dota";

  function MyApp () {
    ...
  }

  export default codePush(MyApp);
  ```

By default, DOTA will check for updates on every app start. If an update is available, it will be silently downloaded, and installed the next time the app is restarted (either explicitly by the end user or by the OS), which ensures the least invasive experience for your end users. If an available update is mandatory, then it will be installed immediately, ensuring that the end user gets it as soon as possible.

If you would like your app to discover updates more quickly, you can refer to the [DOTA API reference](docs/api-js.md#dota) 

## Creating the JavaScript bundle (Hermes)

There are two ways to generate the JavaScript bundle for DOTA:

### 1. Automated Bundle Generation (Recommended)

This method automatically copies the bundle that is generated during your app's build process.

#### For Android:

Add this line to your `android/app/build.gradle`:

```gradle
apply from: "../../node_modules/@d11/dota/android/codepush.gradle"
```

#### For iOS:

1. Add this line at the top of your `Podfile`:
```ruby
require_relative '../node_modules/@d11/dota/ios/scripts/dota_pod_helpers.rb'
```
Note: Make sure that it correctly points to node_modules path.

2. In the `post_install` block of your `Podfile`, add:
```ruby
post_install do |installer| 
  
  # Add the Dota post install script
  # Replace with your app's target name
  dota_post_install(installer, <target>, File.expand_path(__dir__))
end
```

3. Run pod install:
```bash
cd ios && pod install
```

This will add a new build phase named "[Dota] Copy DOTA Bundle" that automatically handles bundle generation and copying. The bundles and assets will be generated in `.dota/<platform>` directory at your project root.

### 2. Manual Bundle Generation (Using CLI Tool)

Use this method if you need more control over the bundle generation process or need to generate bundles outside of the build process.

```bash
# For Android
yarn dota bundle --platform android

# For iOS
yarn dota bundle --platform ios
```

#### Available Options

The CLI supports the following options:

```bash
Options:
  --platform <platform>      Specify platform: android or ios (required)
  --bundle-path <path>      Directory to place the bundle in (default: ".dota")
  --assets-path <path>      Directory to place assets in (default: ".dota")
  --sourcemap-path <path>   Directory to place sourcemaps in (default: ".dota")
  --make-sourcemap         Generate sourcemap (default: false)
  --entry-file <file>      Entry file (default: "index.ts")
  --dev <boolean>          Development mode (default: "false")
  -h, --help              Display help for command

# Example with options
yarn dota bundle --platform android --bundle-path ./custom-path --make-sourcemap
```

#### Output Files

By default, the CLI will generate:
- For Android:
  - `.dota/index.android.bundle` - The optimized Hermes bundle
  - `.dota/` - Directory containing any assets
  - `.dota/index.android.bundle.json` - Sourcemap file (if --make-sourcemap is enabled)

- For iOS:
  - `.dota/main.jsbundle` - The optimized Hermes bundle
  - `.dota/` - Directory containing any assets
  - `.dota/main.jsbundle.json` - Sourcemap file (if --make-sourcemap is enabled)

## Releasing Updates

Once your app is configured and distributed to your users, and you have made some JS or asset changes, it's time to release them.

Release via the DOTA dashboard:
1. Navigate to the DOTA dashboard and select your organization from the sidebar.
![DOTA DASHBOARD](assets/dashboard.png)
2. Select the target app (for example, "Android Production").
![App](assets/app.png)
3. Open the Releases tab.
![Release](assets/release.png)
4. Upload your JS bundle (see [Creating the JavaScript bundle](#creating-the-javascript-bundle-hermes)).
5. Set the target app version for this release.
6. Choose a rollout percentage.
7. Click Launch Release to publish the DOTA update.

Manage releases:
- To increase/decrease rollout or halt a release, go to the Deployments tab and select the deployment you want to manage.
![Manage Release](assets/manage-release-1.png)
![Manage Release](assets/manage-release-2.png)
If you run into any issues, check out the [troubleshooting](#debugging--troubleshooting) details below.

*NOTE: DOTA updates should be tested in modes other than Debug mode. In Debug mode, React Native app always downloads JS bundle generated by packager, so JS bundle downloaded by DOTA does not apply.*

### Debugging / Troubleshooting

The `sync` method includes a lot of diagnostic logging out-of-the-box, so if you're encountering an issue when using it, the best thing to try first is examining the output logs of your app. This will tell you whether the app is configured correctly (like can the plugin find your deployment key?), if the app is able to reach the server, if an available update is being discovered, if the update is being successfully downloaded/installed, etc.

The simplest way to view these logs is to add the flag `--debug` for each command. This will output a log stream that is filtered to just DOTA messages. This makes it easy to identify issues, without needing to use a platform-specific tool, or wade through a potentially high volume of logs.

<img width="540" alt="screen shot 2016-06-21 at 10 15 42 am" src="https://cloud.githubusercontent.com/assets/116461/16246973/838e2e98-37bc-11e6-9649-685f39e325a0.png" />

Additionally, you can also use any of the platform-specific tools to view the DOTA logs, if you are more comfortable with them. Simple start up the Chrome DevTools Console, the Xcode Console (iOS), the [OS X Console](https://en.wikipedia.org/wiki/Console_%28OS_X%29#.7E.2FLibrary.2FLogs) (iOS) and/or ADB logcat (Android), and look for messages which are prefixed with `[CodePush]`.

Note that by default, React Native logs are disabled on iOS in release builds, so if you want to view them in a release build, you need to make the following changes to your `AppDelegate.m` file:

1. Add an `#import <React/RCTLog.h>` statement. For RN < v0.40 use: `#import "RCTLog.h"`

2. Add the following statement to the top of your `application:didFinishLaunchingWithOptions` method:

    ```objective-c
    RCTSetLogThreshold(RCTLogLevelInfo);
    ```

Now you'll be able to see DOTA logs in either debug or release mode, on both iOS or Android. If examining the logs don't provide an indication of the issue, please refer to the following common issues for additional resolution ideas:

| Issue / Symptom | Possible Solution |
|-----------------|-------------------|
| Compilation Error | Double-check that your version of React Native is [compatible](#supported-react-native-platforms) with the DOTA version you are using. |
| Network timeout / hang when calling `sync` or `checkForUpdate` in the iOS Simulator | Try resetting the simulator by selecting the `Simulator -> Reset Content and Settings..` menu item, and then re-running your app. |
| Server responds with a `404` when calling `sync` or `checkForUpdate` | Double-check that the deployment key you added to your `Info.plist` (iOS), `build.gradle` (Android) or that you're passing to `sync`/`checkForUpdate`, is in fact correct. You can run `appcenter codepush deployment list <ownerName>/<appName> --displayKeys` to view the correct keys for your app deployments. |
| Update not being discovered | Double-check that the version of your running app (like `1.0.0`) matches the version you specified when releasing the update to DOTA. Additionally, make sure that you are releasing to the same deployment that your app is configured to sync with. |
| Update not being displayed after restart | If you're not calling `sync` on app start (like within `componentDidMount` of your root component), then you need to explicitly call `notifyApplicationReady` on app start, otherwise, the plugin will think your update failed and roll it back. |
| I've released an update for iOS but my Android app also shows an update and it breaks it | Be sure you have different deployment keys for each platform in order to receive updates correctly |
| I've released new update but changes are not reflected | Be sure that you are running app in modes other than Debug. In Debug mode, React Native app always downloads JS bundle generated by packager, so JS bundle downloaded by DOTA does not apply.
| No JS bundle is being found when running your app against the iOS simulator | By default, React Native doesn't generate your JS bundle when running against the simulator. Therefore, if you're using `[CodePush bundleURL]`, and targetting the iOS simulator, you may be getting a `nil` result. This issue will be fixed in RN 0.22.0, but only for release builds. You can unblock this scenario right now by making [this change](https://github.com/facebook/react-native/commit/9ae3714f4bebdd2bcab4d7fdbf23acebdc5ed2ba) locally.


### Advanced Topics
- [Store Guideline Compliance](docs/store-guidelines.md)
- [Multi-Deployment Testing](docs/multi-deployment-testing.md)
- [Dynamic Deployment Assignment](docs/dynamic-deployment-assignment.md)
- [Supported Components](docs/supported-components.md)

## API Reference

* [JavaScript API](docs/api-js.md)
* [Objective-C API Reference (iOS)](docs/api-ios.md)
* [Swift API Reference (iOS)](docs/api-ios-swift.md)
* [Java API Reference (Android)](docs/api-android.md)


### TypeScript Consumption

This module ships its `*.d.ts` file as part of its NPM package, which allows you to simply `import` it, and receive intellisense in supporting editors (like Visual Studio Code), as well as compile-time type checking if you're using TypeScript. For the most part, this behavior should just work out of the box, however, if you've specified `es6` as the value for either the `target` or `module` [compiler option](http://www.typescriptlang.org/docs/handbook/compiler-options.html) in your [`tsconfig.json`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) file, then just make sure that you also set the `moduleResolution` option to `node`. This ensures that the TypeScript compiler will look within the `node_modules` for the type definitions of imported modules. Otherwise, you'll get an error like the following when trying to import the `@d11/dota` module: `error TS2307: Cannot find module '@d11/dota'`.

---