import { jest } from '@jest/globals';

export const createBundleFromFile = jest.fn();
export const auditBundle = jest.fn();
export const ContextIndex = jest.fn().mockImplementation(() => ({
  addIssues: jest.fn()
}));
export const classifyIssue = jest.fn();
export const serializeIssueContext = jest.fn();
