/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock @d11/dota before importing App
jest.mock('@d11/dota', () => {
  const mockCodePushHOC = jest.fn((config) => (Component) => Component);
  
  // Add properties to the function
  mockCodePushHOC.CheckFrequency = {
    ON_APP_START: 'ON_APP_START',
    ON_APP_RESUME: 'ON_APP_RESUME',
    MANUAL: 'MANUAL',
  };
  
  mockCodePushHOC.InstallMode = {
    IMMEDIATE: 'IMMEDIATE',
    ON_NEXT_RESTART: 'ON_NEXT_RESTART',
    ON_NEXT_RESUME: 'ON_NEXT_RESUME',
  };
  
  mockCodePushHOC.SyncStatus = {
    UP_TO_DATE: 'UP_TO_DATE',
    UPDATE_INSTALLED: 'UPDATE_INSTALLED',
    UPDATE_IGNORED: 'UPDATE_IGNORED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    SYNC_IN_PROGRESS: 'SYNC_IN_PROGRESS',
    CHECKING_FOR_UPDATE: 'CHECKING_FOR_UPDATE',
    AWAITING_USER_ACTION: 'AWAITING_USER_ACTION',
    DOWNLOADING_PACKAGE: 'DOWNLOADING_PACKAGE',
    INSTALLING_UPDATE: 'INSTALLING_UPDATE',
  };
  
  mockCodePushHOC.sync = jest.fn((config, callback) => {
    if (callback) {
      callback('UP_TO_DATE');
    }
    return Promise.resolve();
  });
  
  return {
    __esModule: true,
    default: mockCodePushHOC,
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
