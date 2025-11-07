/**
 * Delivr CLI Checker
 * 
 * Checks if CLI is available (locally or globally) and provides helpful information
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    CLI_COMMAND_NAMES,
    CLI_MESSAGES,
    CLI_PACKAGE_NAME,
} from './DelivrCli.constants';
import type {
    CLIAvailabilityStatus,
    CLINotAvailableStatus,
    GlobalCLIStatus,
    LocalCLIStatus,
} from './DelivrCliChecker.interface';

export class DelivrCliChecker {
  /**
   * Create a local CLI availability status object
   */
  private static createLocalCLIStatus(path: string): LocalCLIStatus {
    return {
      available: true,
      type: 'local',
      path,
    };
  }

  /**
   * Check if CLI is available locally (as devDependency)
   */
  private static checkLocalCLI(sdkRootPath: string): CLIAvailabilityStatus | null {
    try {
      // Split package name to handle scoped packages (e.g., @d11/delivr-cli)
      const packageParts = CLI_PACKAGE_NAME.split('/');
      const localCLIPath = path.join(
        sdkRootPath,
        'node_modules',
        ...packageParts
      );
      
      if (fs.existsSync(localCLIPath)) {
        return DelivrCliChecker.createLocalCLIStatus(localCLIPath);
      }
    } catch (error) {
      // Silently fail
    }
    
    return null;
  }

  /**
   * Create a global CLI availability status object
   */
  private static createGlobalCLIStatus(command: string): GlobalCLIStatus {
    return {
      available: true,
      type: 'global',
      command,
    };
  }

  /**
   * Check if CLI is available globally
   */
  private static checkGlobalCLI(): CLIAvailabilityStatus | null {
    for (const commandName of CLI_COMMAND_NAMES) {
      try {
        execSync(`${commandName} --version`, { stdio: 'ignore' });
        return DelivrCliChecker.createGlobalCLIStatus(commandName);
      } catch (error) {
        // Try next command name
        continue;
      }
    }
    
    return null;
  }

  /**
   * Check if CLI is available (locally or globally)
   */
  public static checkCLIAvailable(sdkRootPath: string): CLIAvailabilityStatus {
    // First check local (devDependency)
    const localStatus = DelivrCliChecker.checkLocalCLI(sdkRootPath);
    if (localStatus) {
      return localStatus;
    }

    // Then check global
    const globalStatus = DelivrCliChecker.checkGlobalCLI();
    if (globalStatus) {
      return globalStatus;
    }

    // Not available
    return { available: false } as CLINotAvailableStatus;
  }

  /**
   * Show CLI information and next steps
   */
  public static showCLIInfo(sdkRootPath: string): void {
    const cliStatus = DelivrCliChecker.checkCLIAvailable(sdkRootPath);

    console.log(CLI_MESSAGES.SDK_INSTALLED);

    if (cliStatus.available) {
      if (cliStatus.type === 'local') {
        // TypeScript knows this is LocalCLIStatus here
        console.log(CLI_MESSAGES.CLI_AVAILABLE_LOCAL);
        console.log(CLI_MESSAGES.CLI_USE_LOCAL);
      } else {
        // TypeScript knows this is GlobalCLIStatus here (type === 'global')
        console.log(CLI_MESSAGES.CLI_AVAILABLE_GLOBAL);
        console.log(CLI_MESSAGES.CLI_USE_GLOBAL(cliStatus.command));
      }
    } else {
      console.log(CLI_MESSAGES.CLI_NOT_AVAILABLE);
      console.log(CLI_MESSAGES.CLI_INSTALL_GLOBAL);
      console.log(CLI_MESSAGES.CLI_USE_NPX);
    }

    console.log(CLI_MESSAGES.NEXT_STEPS);
    console.log(CLI_MESSAGES.STEP_1);
    console.log(CLI_MESSAGES.STEP_2);
    console.log(CLI_MESSAGES.STEP_3);
  }

  /**
   * Run CLI checker and show information
   * This is the main function called by postinstall script
   */
  public static runCLIChecker(): void {
    // Only run if not in CI environment (to avoid noise in CI logs)
    // Skip in CI or when NODE_ENV is production
    if (process.env.CI || process.env.NODE_ENV === 'production') {
      return;
    }

    try {
      // Get SDK root path (parent of scripts directory)
      const sdkRootPath = path.join(__dirname, '..', '..');
      DelivrCliChecker.showCLIInfo(sdkRootPath);
    } catch (error) {
      // Silently fail - postinstall scripts shouldn't break installation
      // Just log a simple message if needed
      console.log('\n📦 @d11/dota SDK installed successfully!\n');
    }
  }
}
