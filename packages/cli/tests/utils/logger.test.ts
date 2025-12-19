import { jest } from '@jest/globals';

describe('logger', () => {
  const originalEnv = process.env;
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalDebug = console.debug;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.debug = originalDebug;
  });

  it('newLine prints an empty line and is chainable', async () => {
    const { Logger } = await import('../../src/utils/logger');
    const out = Logger.newLine();
    expect(console.log).toHaveBeenCalledWith('');
    expect(out).toBe(Logger);
  });

  it('info/success/warning/error log via console', async () => {
    const { Logger } = await import('../../src/utils/logger');

    Logger.info('i');
    Logger.success('s');
    Logger.warning('w');
    Logger.error('e');

    expect(console.log).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('debug only logs when DEBUG is set', async () => {
    const { Logger } = await import('../../src/utils/logger');

    delete process.env.DEBUG;
    Logger.debug('x');
    expect(console.debug).not.toHaveBeenCalled();

    process.env.DEBUG = '1';
    Logger.debug('x');
    expect(console.debug).toHaveBeenCalled();
  });
});
