import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Platform configuration
const PLATFORMS = {
  android: {
    bundleDir: '.dota/android',
    bundleFile: 'index.android.bundle',
    buildCommand: 'yarn android --mode=Release',
    uninstallCommand: (appId) => `adb uninstall ${appId}`,
    logcatCommand: 'adb logcat',
    deviceCheck: () => {
      try {
        const result = execSync('adb devices', { encoding: 'utf8', stdio: 'pipe' });
        return result.includes('device') && !result.includes('offline');
      } catch {
        return false;
      }
    },
    getDeviceId: () => {
      try {
        const result = execSync('adb devices', { encoding: 'utf8', stdio: 'pipe' });
        const lines = result.split('\n').filter(l => l.includes('device') && !l.includes('List'));
        if (lines.length > 0) {
          return lines[0].split('\t')[0];
        }
      } catch {}
      return null;
    }
  },
  ios: {
    bundleDir: '.dota/ios',
    bundleFile: 'main.jsbundle',
    buildCommand: 'yarn ios --mode Release',
    uninstallCommand: (appId) => {
      const deviceId = getCurrentPlatform().getDeviceId();
      return deviceId ? `xcrun simctl uninstall ${deviceId} ${appId}` : `xcrun simctl uninstall booted ${appId}`;
    },
    logcatCommand: 'xcrun simctl spawn booted log stream',
    deviceCheck: () => {
      try {
        execSync('xcrun simctl list devices booted', { encoding: 'utf8', stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    getDeviceId: () => {
      try {
        // Check for booted device first
        const booted = execSync('xcrun simctl list devices booted', { encoding: 'utf8', stdio: 'pipe' });
        const bootedMatch = booted.match(/\(([0-9A-F-]{36})\)/);
        if (bootedMatch) return bootedMatch[1];
        
        // Fallback to available devices
        const available = execSync('xcrun simctl list devices available', { encoding: 'utf8', stdio: 'pipe' });
        const availableMatch = available.match(/iPhone[^(]*\(([0-9A-F-]{36})\)/);
        if (availableMatch) return availableMatch[1];
      } catch {}
      return null;
    },
    bootSimulator: (deviceId) => {
      try {
        if (!deviceId) {
          deviceId = getCurrentPlatform().getDeviceId();
        }
        if (deviceId) {
          execSync(`xcrun simctl boot ${deviceId}`, { stdio: 'pipe' });
          console.log(`✅ Booted iOS simulator: ${deviceId}`);
        }
      } catch (err) {
        // Simulator might already be booted
        console.log(`ℹ️ iOS simulator boot status: ${err.message}`);
      }
    }
  }
};

// Current platform (defaults to android, can be set via setPlatform)
let currentPlatform = process.env.TEST_PLATFORM || 'android';

export function setPlatform(platform) {
  if (!PLATFORMS[platform]) {
    throw new Error(`Unsupported platform: ${platform}. Supported: ${Object.keys(PLATFORMS).join(', ')}`);
  }
  currentPlatform = platform;
  console.log(`📱 Platform set to: ${platform}`);
}

export function getCurrentPlatform() {
  return PLATFORMS[currentPlatform];
}

export function getPlatformName() {
  return currentPlatform;
}

// Get platform-specific bundle ID
export function getBundleId(platform = null) {
  const targetPlatform = platform || currentPlatform;
  const bundleIds = {
    android: 'com.mycodepushapp',
    ios: 'org.reactjs.native.example.MyCodePushApp'
  };
  return bundleIds[targetPlatform];
}

// Ensure emulator/simulator is ready
export function ensureDeviceReady() {
  const platform = getCurrentPlatform();
  const platformName = currentPlatform;
  
  // Check if device is already ready
  if (platform.deviceCheck()) {
    console.log(`✅ ${platformName} device is ready`);
    return true;
  }
  
  console.log(`⚠️ No ${platformName} device detected. Attempting to boot...`);
  
  if (currentPlatform === 'ios' && platform.bootSimulator) {
    // Try to boot iOS simulator
    const deviceId = platform.getDeviceId();
    if (deviceId) {
      platform.bootSimulator(deviceId);
      // Wait a bit for simulator to be ready
      let attempts = 0;
      while (attempts < 10 && !platform.deviceCheck()) {
        execSync('sleep 2', { stdio: 'pipe' });
        attempts++;
      }
    } else {
      console.log('⚠️ No iOS simulator found. Please create one using: xcrun simctl list devices');
    }
  } else if (currentPlatform === 'android') {
    console.log('⚠️ Please start an Android emulator manually');
    console.log('   You can use: emulator -avd <AVD_NAME>');
  }
  
  return platform.deviceCheck();
}

export function directoryChange(src, dest) {
  // Always resolve relative to project root (go up one level from __tests__)
  const projectRoot = path.resolve(__dirname, '..');
  const platform = getCurrentPlatform();
  
  // Replace platform-specific paths
  const resolvedSrc = path.resolve(projectRoot, src.replace('{platform}', currentPlatform));
  const resolvedDest = path.resolve(projectRoot, dest.replace('{platform}', currentPlatform));
  
  // Get destination parent directory
  const destParent = path.dirname(resolvedDest);
  
  // Create destination parent directory if it doesn't exist (including .dota-testing)
  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
    console.log(`📁 Created destination directory: ${destParent}`);
  }

  // Verify source exists
  if (!fs.existsSync(resolvedSrc)) {
    throw new Error(`Source directory not found: ${src}`);
  }

  // Remove destination if it already exists
  if (fs.existsSync(resolvedDest)) {
    fs.rmSync(resolvedDest, { recursive: true, force: true });
    console.log(`🧹 Removed existing destination: ${dest}`);
  }

  try {
    fs.renameSync(resolvedSrc, resolvedDest);
    console.log(`✅ Moved folder from ${src} to ${dest}`);
  } catch (err) {
    console.error(`❌ Failed to move folder: ${err.message}`);
    throw err;
  }
}
export function deleteTestingDirectory(testingDir) {
  const projectRoot = path.resolve(__dirname, '..');
  const resolvedTestingDir = path.resolve(projectRoot, testingDir);

  if (!fs.existsSync(resolvedTestingDir)) {
    console.log(`ℹ️ No folder found at: ${resolvedTestingDir}, skipping delete.`);
    return;
  }

  try {
    fs.rmSync(resolvedTestingDir, { recursive: true, force: true });
    console.log(`🗑️ Deleted folder: ${resolvedTestingDir}`);
  } catch (err) {
    console.error(`❌ Failed to delete folder: ${err.message}`);
    process.exit(1);
  }
}
export function run(cmd, description) {
  console.log(`\n⚙️  ${description || cmd}`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Completed: ${cmd}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Command failed: ${cmd}`);
    console.error(`Error: ${error.message}`);
    // Prevent crash — return a failure flag, don't throw
    return { success: false, error };
  }
}
export function runMaestroTest(yamlFilePath, platform = null) {
  const targetPlatform = platform || currentPlatform;
  const deviceId = PLATFORMS[targetPlatform].getDeviceId();
  const projectRoot = path.resolve(__dirname, '..');
  
  try {
    // Resolve YAML file path relative to project root
    const resolvedYamlPath = path.isAbsolute(yamlFilePath) 
      ? yamlFilePath 
      : path.resolve(projectRoot, yamlFilePath);
    
    // Read the YAML file and replace device field and appId with platform-specific values
    let yamlContent = fs.readFileSync(resolvedYamlPath, 'utf8');
    // Replace device line with the target platform
    yamlContent = yamlContent.replace(/^device:\s*.+$/m, `device: ${targetPlatform}`);
    // Replace appId with platform-specific bundle ID
    const bundleId = getBundleId(targetPlatform);
    yamlContent = yamlContent.replace(/^appId:\s*.+$/m, `appId: ${bundleId}`);
    
    // Create a temporary YAML file with platform-specific device
    const tempYamlPath = path.join(
      path.dirname(resolvedYamlPath),
      `.temp-${path.basename(resolvedYamlPath, '.yaml')}-${targetPlatform}.yaml`
    );
    fs.writeFileSync(tempYamlPath, yamlContent);
    
    try {
      // iOS: Only install app if it doesn't exist (preserve CodePush state)
      if (targetPlatform === 'ios' && deviceId) {
        const bundleId = getBundleId(targetPlatform);
        
        // Check if app is already installed
        let appInstalled = false;
        try {
          const listResult = execSync(`xcrun simctl listapps ${deviceId}`, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            cwd: projectRoot
          });
          appInstalled = listResult.includes(bundleId);
        } catch (err) {
          appInstalled = false;
        }
        
        // Only install if app doesn't exist
        if (!appInstalled) {
          // Find the built .app file
          const derivedDataDir = path.join(os.homedir(), 'Library', 'Developer', 'Xcode', 'DerivedData');
          let appToInstall = null;
          
          if (fs.existsSync(derivedDataDir)) {
            const dirs = fs.readdirSync(derivedDataDir).filter(d => d.startsWith('MyCodePushApp-'));
            for (const dir of dirs) {
              const releasePath = path.join(derivedDataDir, dir, 'Build', 'Products', 'Release-iphonesimulator', 'MyCodePushApp.app');
              if (fs.existsSync(releasePath)) {
                appToInstall = releasePath;
                break;
              }
              const debugPath = path.join(derivedDataDir, dir, 'Build', 'Products', 'Debug-iphonesimulator', 'MyCodePushApp.app');
              if (fs.existsSync(debugPath)) {
                appToInstall = debugPath;
                break;
              }
            }
          }
          
          if (appToInstall) {
            console.log(`📱 Installing iOS app on simulator ${deviceId}...`);
            try {
              execSync(`xcrun simctl install ${deviceId} "${appToInstall}"`, { 
                stdio: 'inherit',
                cwd: projectRoot
              });
              console.log('✅ iOS app installed successfully');
              execSync('sleep 2', { stdio: 'pipe' });
            } catch (err) {
              console.warn(`⚠️ Could not install iOS app: ${err.message}`);
            }
          }
        }
      }
      
      // Android: Ensure app is installed and ready before Maestro runs
      if (targetPlatform === 'android') {
        const bundleId = getBundleId(targetPlatform);
        // Check if app is installed
        try {
          execSync(`adb shell pm list packages | grep ${bundleId}`, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            cwd: projectRoot
          });
          // App is installed, wait a moment for it to be fully ready
          execSync('sleep 2', { stdio: 'pipe' });
        } catch (err) {
          // App not installed - this shouldn't happen as yarn android installs it
          console.warn(`⚠️ Android app ${bundleId} not found. Maestro may fail.`);
        }
      }
      
      // Build maestro command
      let maestroCmd = `maestro`;
      if (deviceId && targetPlatform === 'ios') {
        maestroCmd += ` --device ${deviceId}`;
      }
      maestroCmd += ` test ${tempYamlPath}`;
      
      execSync(maestroCmd, { 
        stdio: 'inherit',
        cwd: projectRoot
      });
      console.log(`✅ Maestro flow completed successfully for ${targetPlatform}.`);
    } finally {
      // Clean up temporary YAML file
      if (fs.existsSync(tempYamlPath)) {
        fs.unlinkSync(tempYamlPath);
      }
    }
  } catch (err) {
    console.error('❌ Maestro flow failed:', err.message);
    throw err;
  }
}



// Store original content for revert
const originalContentCache = new Map();

export function updateTemplateFileName(filePath, newTemplateName) {
  // Resolve path relative to project root (go up one level from __tests__)
  const projectRoot = path.resolve(__dirname, '..');
  const resolvedFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
  
  if (!fs.existsSync(resolvedFilePath)) {
    throw new Error(`File not found: ${resolvedFilePath}`);
  }
  
  let code = fs.readFileSync(resolvedFilePath, 'utf8');
  
  // Store original content if not already stored
  if (!originalContentCache.has(resolvedFilePath)) {
    originalContentCache.set(resolvedFilePath, code);
    console.log(`📝 Stored original content for ${resolvedFilePath}`);
  }
  
  // Find the NewAppScreen component and replace its entire content
  // Pattern: <NewAppScreen ... /> or <NewAppScreen ... >...</NewAppScreen>
  const newAppScreenPattern = /<NewAppScreen[\s\S]*?\/>/;
  const newAppScreenPatternMultiline = /<NewAppScreen[\s\S]*?<\/NewAppScreen>/;
  
  // Check if Text is already imported from react-native
  const hasTextImport = /import\s*\{[^}]*\bText\b[^}]*\}\s*from\s*['"]react-native['"]/.test(code);
  
  // Add Text to react-native import if needed
  if (!hasTextImport) {
    const reactNativeImportPattern = /(import\s*\{[^}]+)\}\s*from\s*['"]react-native['"]/;
    if (reactNativeImportPattern.test(code)) {
      code = code.replace(
        reactNativeImportPattern,
        (match, imports) => {
          // Add Text to the imports if not already there
          if (!match.includes('Text')) {
            return `${imports}, Text } from 'react-native'`;
          }
          return match;
        }
      );
    } else {
      // If no react-native import exists, add it after React import
      const reactImport = code.match(/import\s+.*\s+from\s+['"]react['"]/);
      if (reactImport) {
        code = code.replace(
          reactImport[0],
          `${reactImport[0]}\nimport { Text } from 'react-native';`
        );
      } else {
        // Add both imports at the top
        code = `import { Text } from 'react-native';\n${code}`;
      }
    }
  }
  
  // Replace NewAppScreen with Text component showing the message
  const updatedMessage = "DOTA Updated bundle loaded successfully🚀";
  const replacement = `<Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 50 }}>${updatedMessage}</Text>`;
  
  if (newAppScreenPatternMultiline.test(code)) {
    code = code.replace(newAppScreenPatternMultiline, replacement);
  } else if (newAppScreenPattern.test(code)) {
    code = code.replace(newAppScreenPattern, replacement);
  } else {
    console.warn('⚠️ NewAppScreen component not found in the file.');
    return;
  }
  
  fs.writeFileSync(resolvedFilePath, code, 'utf8');
  console.log(`✅ Updated ${resolvedFilePath} to show: "${updatedMessage}"`);
}

export function revertTemplateFileName(filePath, newTemplateName) {
  // Resolve path relative to project root (go up one level from __tests__)
  const projectRoot = path.resolve(__dirname, '..');
  const resolvedFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
  
  if (!fs.existsSync(resolvedFilePath)) {
    throw new Error(`File not found: ${resolvedFilePath}`);
  }
  
  // Check if we have original content cached
  if (!originalContentCache.has(resolvedFilePath)) {
    console.warn(`⚠️ No original content found for ${resolvedFilePath}. Cannot revert.`);
    return;
  }
  
  // Restore original content
  const originalCode = originalContentCache.get(resolvedFilePath);
  fs.writeFileSync(resolvedFilePath, originalCode, 'utf8');
  
  // Remove from cache after revert
  originalContentCache.delete(resolvedFilePath);
  
  console.log(`✅ Reverted ${resolvedFilePath} to original content`);
}

export function createSubFolderInTestingDir(subFolderName) {
  const projectRoot = path.resolve(__dirname, '..');
  const dotaTestingPath = path.resolve(projectRoot, '.dota-testing');
  const subFolderPath = path.resolve(dotaTestingPath, subFolderName);

  try {
    // Ensure .dota-testing exists
    if (!fs.existsSync(dotaTestingPath)) {
      fs.mkdirSync(dotaTestingPath, { recursive: true });
      console.log(`📁 Created base folder: ${dotaTestingPath}`);
    }

    // Create the subfolder
    if (!fs.existsSync(subFolderPath)) {
      fs.mkdirSync(subFolderPath, { recursive: true });
      console.log(`📁 Created subfolder: ${subFolderPath}`);
    } else {
      console.log(`ℹ️ Subfolder already exists: ${subFolderPath}`);
    }
  } catch (err) {
    console.error(`❌ Failed to create subfolder: ${err.message}`);
    process.exit(1);
  }
}


export function moveAssets(assetFolderName = 'drawable-mdpi') {
  const projectRoot = path.resolve(__dirname, '..');
  const platform = getCurrentPlatform();
  
  // For iOS, assets are in 'assets' folder (not Assets.xcassets)
  // This matches the build script that copies assets to .dota/ios/assets
  if (currentPlatform === 'ios') {
    assetFolderName = 'assets';
  }
  
  const sourcePath = path.resolve(projectRoot, `.dota-testing/${currentPlatform}-cp/${assetFolderName}`);
  const destinationBase = path.resolve(projectRoot, `.dota-testing/.codepush`);
  const destinationPath = path.resolve(destinationBase, assetFolderName);

  try {
    // Ensure source exists
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️ Source folder not found: ${sourcePath}`);
      console.warn(`⚠️ Platform: ${currentPlatform}, Asset folder: ${assetFolderName}`);
      // List what's actually in the cp directory for debugging
      const cpDir = path.resolve(projectRoot, `.dota-testing/${currentPlatform}-cp`);
      if (fs.existsSync(cpDir)) {
        const contents = fs.readdirSync(cpDir);
        console.warn(`⚠️ Contents of .dota-testing/${currentPlatform}-cp/: ${contents.join(', ')}`);
      }
      return;
    }

    // Ensure destination parent exists
    if (!fs.existsSync(destinationBase)) {
      fs.mkdirSync(destinationBase, { recursive: true });
    }

    // Remove destination if already exists (overwrite behavior)
    if (fs.existsSync(destinationPath)) {
      fs.rmSync(destinationPath, { recursive: true, force: true });
      console.log(`🧹 Removed existing folder at: ${destinationPath}`);
    }

    // Move the assets
    fs.renameSync(sourcePath, destinationPath);
    console.log(`✅ Moved assets from ${sourcePath} → ${destinationPath}`);
    
    // Verify assets were moved correctly (list files for debugging)
    if (fs.existsSync(destinationPath)) {
      const assetFiles = fs.readdirSync(destinationPath, { recursive: true });
      const imageFiles = assetFiles.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
      console.log(`✅ Assets moved successfully. Found ${imageFiles.length} image file(s) in assets folder.`);
    }
  } catch (err) {
    console.error(`❌ Failed to move assets: ${err.message}`);
    process.exit(1);
  }
}

export function corruptBundle(bundlePath, corruptionType = 'truncate', bytesToRemove = 1000) {
  const projectRoot = path.resolve(__dirname, '..');
  const resolvedBundlePath = path.resolve(projectRoot, bundlePath);

  try {
    if (!fs.existsSync(resolvedBundlePath)) {
      console.error(`❌ Bundle not found: ${resolvedBundlePath}`);
      process.exit(1);
    }

    const originalSize = fs.statSync(resolvedBundlePath).size;
    const bundleData = fs.readFileSync(resolvedBundlePath);

    let corruptedData;

    switch (corruptionType) {
      case 'truncate':
        // Remove bytes from the end
        corruptedData = bundleData.slice(0, bundleData.length - bytesToRemove);
        console.log(`🔨 Corrupting bundle: Truncated ${bytesToRemove} bytes from end`);
        break;

      case 'overwrite':
        // Overwrite random section with zeros
        const startPos = Math.floor(bundleData.length / 2);
        corruptedData = Buffer.from(bundleData);
        corruptedData.fill(0, startPos, startPos + bytesToRemove);
        console.log(`🔨 Corrupting bundle: Overwritten ${bytesToRemove} bytes with zeros at position ${startPos}`);
        break;

      case 'header':
        // Corrupt the JavaScript header
        corruptedData = Buffer.from(bundleData);
        corruptedData.write('CORRUPTED_BUNDLE', 0, 'utf8');
        console.log(`🔨 Corrupting bundle: Corrupted JavaScript header`);
        break;

      case 'middle':
        // Delete bytes from the middle
        const midPoint = Math.floor(bundleData.length / 2);
        corruptedData = Buffer.concat([
          bundleData.slice(0, midPoint),
          bundleData.slice(midPoint + bytesToRemove)
        ]);
        console.log(`🔨 Corrupting bundle: Removed ${bytesToRemove} bytes from middle`);
        break;

      default:
        console.error(`❌ Unknown corruption type: ${corruptionType}`);
        process.exit(1);
    }

    // Write corrupted bundle
    fs.writeFileSync(resolvedBundlePath, corruptedData);
    const newSize = fs.statSync(resolvedBundlePath).size;
    
    console.log(`✅ Bundle corrupted successfully!`);
    console.log(`   Original size: ${originalSize} bytes`);
    console.log(`   New size: ${newSize} bytes`);
    console.log(`   Size difference: ${originalSize - newSize} bytes`);

  } catch (err) {
    console.error(`❌ Failed to corrupt bundle: ${err.message}`);
    process.exit(1);
  }
}

export function addImage() {
  const projectRoot = path.resolve(__dirname, '..');
  const imageFile = path.join(projectRoot, "assets", "icon.png");
  const appFile = path.join(projectRoot, "App.tsx");

  if (!fs.existsSync(imageFile)) {
    throw new Error(`❌ Image not found: ${imageFile}`);
  }
  if (!fs.existsSync(appFile)) {
    throw new Error(`❌ App.tsx not found: ${appFile}`);
  }

  let code = fs.readFileSync(appFile, "utf8");

  // Step 1: Add React import with useState if not present
  if (!code.includes("import React")) {
    code = `import React, { useState } from 'react';\n${code}`;
    console.log(`✅ Added React and useState import`);
  } else if (!code.includes("useState")) {
    code = code.replace(
      /import React([^;]+);/,
      (match) => {
        if (match.includes('{')) {
          return match.replace(/\{([^}]+)\}/, (m, imports) => {
            if (!imports.includes('useState')) {
              return `{ ${imports.trim()}, useState }`;
            }
            return m;
          });
        } else {
          return match.replace('React', 'React, { useState }');
        }
      }
    );
    console.log(`✅ Added useState to React import`);
  }

  // Step 2: Add image import
  const importImage = `import IconImage from './assets/icon.png';`;
  if (!code.includes(importImage)) {
    code = code.replace(
      /(import React[^\n]+\n)/,
      `$1${importImage}\n`
    );
    console.log(`✅ Added image import to App.tsx`);
  }

  // Step 3: Add Image and Text to react-native imports
  const reactNativeImportPattern = /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/;
  if (reactNativeImportPattern.test(code)) {
    code = code.replace(
      reactNativeImportPattern,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        const toAdd = [];
        
        if (!importList.includes('Image')) toAdd.push('Image');
        if (!importList.includes('Text')) toAdd.push('Text');
        
        if (toAdd.length > 0) {
          console.log(`✅ Added ${toAdd.join(', ')} to react-native imports`);
          return `import {${imports.trim()}, ${toAdd.join(', ')} } from 'react-native'`;
        }
        return match;
      }
    );
  }

  // Step 4: Add state variables to AppContent function
  if (!code.includes("imageLoaded") || !code.includes("imageError")) {
    code = code.replace(
      /(function AppContent\(\) \{[\s\S]*?)(const safeAreaInsets)/,
      `$1const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  $2`
    );
    console.log(`✅ Added imageLoaded and imageError state variables`);
  }

  // Step 5: Inject Image component with onLoad and onError handlers
  if (!code.includes("<Image source={IconImage}")) {
    const newAppScreenPattern = /(<NewAppScreen[\s\S]*?\/>)/m;

    if (newAppScreenPattern.test(code)) {
      const imageComponent = `$1
      <View style={styles.imageContainer}>
        <Image 
          source={IconImage} 
          style={styles.image}
          onLoad={() => {
            setImageLoaded(true);
            setImageError(false);
            console.log('✅ Image loaded successfully!');
          }}
          onError={(error) => {
            console.log('❌ Image failed to load:', error);
            setImageError(true);
            setImageLoaded(false);
          }}
        />
        {imageLoaded && !imageError && (
          <Text style={styles.successText}>✅ Image Loaded Successfully</Text>
        )}
        {imageError && (
          <Text style={styles.errorText}>❌ Image Failed to Load</Text>
        )}
      </View>`;
      
      code = code.replace(newAppScreenPattern, imageComponent);
      console.log(`🖼️ Injected Image with onLoad/onError handlers and status messages`);
    } else {
      console.warn("⚠️ Could not find <NewAppScreen /> JSX to insert into.");
    }
  } else {
    console.log("ℹ️ Image already exists in App.tsx, skipping injection.");
  }

  // Step 6: COMPLETELY REWRITE StyleSheet (prevents corruption)
  // Remove any existing malformed StyleSheet
  code = code.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);?/g, '');
  
  // Create fresh complete StyleSheet
  const completeStyles = `const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  successText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
  },
});
`;
  
  // Insert before const env or export
  code = code.replace(/(const env = |export default)/, `${completeStyles}\n$1`);
  console.log(`✅ Created complete StyleSheet (prevents corruption)`)

  fs.writeFileSync(appFile, code, "utf8");
  console.log("✅ App.tsx updated successfully with image loading state and error handling!");
}
export function removeImage() {
  const projectRoot = path.resolve(__dirname, '..');
  const appFile = path.join(projectRoot, "App.tsx");

  if (!fs.existsSync(appFile)) {
    throw new Error(`❌ App.tsx not found: ${appFile}`);
  }

  let code = fs.readFileSync(appFile, "utf8");
  const changes = [];

  // 1. Fix React import - replace with useState with plain React import
  if (code.includes("import React, { useState } from 'react';")) {
    code = code.replace(/import React, \{ useState \} from 'react';\n/, "import React from 'react';\n\n");
    changes.push('Restored React import (removed useState)');
  } else if (code.includes("{ useState }")) {
    // Handle case where useState is in React import with other items
    code = code.replace(/import React, \{ useState \} from 'react';/, "import React from 'react';");
    changes.push('Removed useState from React import');
  }

  // 2. Remove image import line completely
  if (code.includes("import IconImage from './assets/icon.png';")) {
    code = code.replace(/import IconImage from '\.\/assets\/icon\.png';\n?/g, '');
    changes.push('Removed image import');
  }

  // 3. Remove Image and Text from react-native imports
  const reactNativeImportPattern = /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/;
  if (reactNativeImportPattern.test(code)) {
    code = code.replace(reactNativeImportPattern, (match, imports) => {
      const importList = imports.split(',').map(i => i.trim()).filter(Boolean);
      const filtered = importList.filter(i => i !== 'Image' && i !== 'Text');
      
      if (filtered.length !== importList.length) {
        changes.push('Removed Image and Text from react-native imports');
      }
      return `import {${filtered.join(', ')}} from 'react-native'`;
    });
  }

  // 4. Remove state variables (multiple patterns to handle different formatting)
  const stateVarPatterns = [
    /\s*const \[imageLoaded, setImageLoaded\] = useState\(false\);\s*\n\s*const \[imageError, setImageError\] = useState\(false\);\s*\n/g,
    /const \[imageLoaded, setImageLoaded\] = useState\(false\);\s*\n/g,
    /const \[imageError, setImageError\] = useState\(false\);\s*\n/g,
  ];
  
  stateVarPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      code = code.replace(pattern, '');
      if (!changes.includes('Removed state variables')) {
        changes.push('Removed state variables');
      }
    }
  });

  // 5. Remove entire Image component block (be specific to avoid removing main View)
  const imageBlockPatterns = [
    // Pattern 1: Full View with imageContainer style (the specific image block)
    /\s*<View style=\{styles\.imageContainer\}>[\s\S]*?<\/View>\s*\n?/g,
  ];
  
  imageBlockPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      code = code.replace(pattern, '\n');
      if (!changes.includes('Removed Image component block')) {
        changes.push('Removed Image component block');
      }
    }
  });

  // 6. COMPLETELY REWRITE StyleSheet to clean baseline
  if (/const styles = StyleSheet\.create\(/m.test(code)) {
    // Remove existing StyleSheet completely
    code = code.replace(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);?/g, '');
    
    // Insert clean baseline StyleSheet
    const cleanStyleSheet = `const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
`;
    code = code.replace(/(const env = |export default)/, `${cleanStyleSheet}\n$1`);
    changes.push('Replaced StyleSheet with clean baseline');
  }

  // 7. Fix templateFileName to "App.tsx"
  if (code.includes('templateFileName="AppNew.tsx"')) {
    code = code.replace(/templateFileName="AppNew\.tsx"/, 'templateFileName="App.tsx"');
    changes.push('Fixed templateFileName to "App.tsx"');
  }

  // 8. Clean up extra blank lines
  code = code.replace(/\n{3,}/g, '\n\n');
  
  // 9. Ensure proper spacing after first import
  code = code.replace(/^(import React from 'react';)\n+(import \{ NewAppScreen)/m, '$1\n\n$2');

  // 10. Fix AppContent function formatting
  code = code.replace(/function AppContent\(\) \{\s+const safeAreaInsets/g, 'function AppContent() {\n  const safeAreaInsets');
  
  // 11. Fix JSX closing tag indentation - handle various spacing issues
  code = code.replace(/\/>\s+<\/View>/g, '/>\n    </View>');
  
  // 12. Fix return statement closing
  code = code.replace(/<\/View>\s+\);/g, '</View>\n  );');
  
  // 13. Ensure proper NewAppScreen to View closing spacing
  code = code.replace(/(\/>)\s+(<\/View>)/g, '$1\n    $2');

  fs.writeFileSync(appFile, code, "utf8");

  if (changes.length > 0) {
    console.log("\n✅ Successfully reverted all image changes:");
    changes.forEach(change => console.log(`   - ${change}`));
  } else {
    console.log("ℹ️ No image-related code found to remove");
  }
  
  console.log("✅ App.tsx fully restored to baseline!");
}