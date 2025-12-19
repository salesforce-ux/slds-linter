import { ProgressHandler } from '../../src/services/progress-handler';

describe('ProgressHandler environment branches', () => {
  const originalEnv = process.env;
  const originalIsTTY = process.stdout.isTTY;

  afterEach(() => {
    process.env = { ...originalEnv };
    (process.stdout as any).isTTY = originalIsTTY;
  });

  it('does not create a progress bar in CI', () => {
    process.env = { ...originalEnv, CI: 'true' };
    (process.stdout as any).isTTY = true;

    const progress = new ProgressHandler({ total: 10 });

    expect(progress.getCompleted()).toBe(0);
    progress.increment();
    progress.update(5);
    expect(progress.getCompleted()).toBe(5);
    expect(() => progress.stop()).not.toThrow();
  });

  it('does not create a progress bar when not TTY', () => {
    process.env = { ...originalEnv };
    (process.stdout as any).isTTY = false;

    const progress = new ProgressHandler({ total: 10 });

    progress.increment();
    expect(progress.getCompleted()).toBe(1);
  });
});
