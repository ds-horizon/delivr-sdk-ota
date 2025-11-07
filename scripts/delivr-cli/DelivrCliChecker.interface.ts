/**
 * Types for Delivr CLI checker
 */

export type LocalCLIStatus = {
  available: true;
  type: 'local';
  path: string;
};

export type GlobalCLIStatus = {
  available: true;
  type: 'global';
  command: string;
};

export type CLINotAvailableStatus = {
  available: false;
};

export type CLIAvailabilityStatus =
  | LocalCLIStatus
  | GlobalCLIStatus
  | CLINotAvailableStatus;
