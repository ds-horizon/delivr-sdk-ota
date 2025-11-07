/**
 * Constants for Delivr CLI checker
 */

export const CLI_PACKAGE_NAME = '@d11/delivr-cli';
export const CLI_COMMAND_NAMES = ['delivr-cli', 'code-push-standalone'];

export const CLI_MESSAGES = {
  SDK_INSTALLED: '\n📦 @d11/dota SDK installed successfully!\n',
  CLI_AVAILABLE_LOCAL: '✅ CLI tool (@d11/delivr-cli) is available as a dev dependency',
  CLI_AVAILABLE_GLOBAL: '✅ CLI tool is available globally',
  CLI_USE_LOCAL: '   You can use it via: npx @d11/delivr-cli <command>\n',
  CLI_USE_GLOBAL: (command: string) => `   Use it via: ${command} <command>\n`,
  CLI_NOT_AVAILABLE: '💡 To deploy OTA updates, you\'ll need the CLI tool:',
  CLI_INSTALL_GLOBAL: '   Install globally: npm install -g @d11/delivr-cli',
  CLI_USE_NPX: '   Or use via npx: npx @d11/delivr-cli <command>\n',
  NEXT_STEPS: '📚 Next steps:',
  STEP_1: '   1. Follow iOS/Android setup: https://github.com/ds-horizon/delivr-sdk-ota#getting-started',
  STEP_2: '   2. Deploy updates: npx @d11/delivr-cli release <appName> <bundlePath> <version>',
  STEP_3: '   3. Read the docs: https://github.com/ds-horizon/delivr-sdk-ota\n',
} as const;

