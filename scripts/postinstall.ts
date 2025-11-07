#!/usr/bin/env node

/**
 * Postinstall script for @d11/dota SDK
 * 
 * This script runs after npm install to:
 * 1. Check if CLI is available (either as devDependency or globally)
 * 2. Provide helpful information about using the CLI
 */

import { DelivrCliChecker } from './delivr-cli/DelivrCliChecker';

// Run the CLI checker
DelivrCliChecker.runCLIChecker();

