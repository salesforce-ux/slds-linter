import { jest } from '@jest/globals';

class FakeWorker {
  private handlers: Record<string, Function[]> = {};
  private onceHandlers: Record<string, Function[]> = {};

  constructor(public scriptPath: string, public options: any) {
    // no-op
  }

  on(event: string, handler: (...args: any[]) => void) {
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(handler);
    return this;
  }

  once(event: string, handler: (...args: any[]) => void) {
    this.onceHandlers[event] = this.onceHandlers[event] || [];
    this.onceHandlers[event].push(handler);
    return this;
  }

  emit(event: string, ...args: any[]) {
    for (const h of this.handlers[event] || []) h(...args);
    const once = this.onceHandlers[event] || [];
    this.onceHandlers[event] = [];
    for (const h of once) h(...args);
  }

  terminate = jest.fn();
}

describe('BatchProcessor', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('processes batches, collects results, and updates progress', async () => {
    const createdWorkers: FakeWorker[] = [];

    await jest.unstable_mockModule('worker_threads', () => ({
      Worker: class extends FakeWorker {
        constructor(scriptPath: string, options: any) {
          super(scriptPath, options);
          createdWorkers.push(this);
        }
      },
    }));

    const increment = jest.fn();
    const stop = jest.fn();
    await jest.unstable_mockModule('../../src/services/progress-handler', () => ({
      ProgressHandler: class {
        constructor() {
          // no-op
        }
        increment = increment;
        stop = stop;
      }
    }));

    const debug = jest.fn();
    const warning = jest.fn();
    const error = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug, warning, error }
    }));

    const { BatchProcessor } = await import('../../src/services/batch-processor');

    const promise = BatchProcessor.processBatches(
      [['a.css'], ['b.css']],
      '/worker.js',
      { some: 'config' },
      { maxWorkers: 1, timeoutMs: 500 }
    );

    // allow loop to create worker and attach handlers
    await Promise.resolve();

    // first batch completes
    createdWorkers[0].emit('message', { success: true, results: ['ok'] });
    createdWorkers[0].emit('exit', 1);

    // advance polling timer to allow processor to schedule next worker
    await jest.advanceTimersByTimeAsync(150);

    // second batch worker should exist now
    expect(createdWorkers.length).toBeGreaterThanOrEqual(2);
    createdWorkers[1].emit('error', new Error('nope'));
    createdWorkers[1].emit('exit', 1);

    await jest.advanceTimersByTimeAsync(150);

    const results = await promise;

    expect(results).toHaveLength(2);
    expect(increment).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(debug).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    expect(warning).toHaveBeenCalled();
  });

  it('terminates worker on timeout and clears timeout on exit', async () => {
    const createdWorkers: FakeWorker[] = [];

    await jest.unstable_mockModule('worker_threads', () => ({
      Worker: class extends FakeWorker {
        constructor(scriptPath: string, options: any) {
          super(scriptPath, options);
          createdWorkers.push(this);
        }
      },
    }));

    await jest.unstable_mockModule('../../src/services/progress-handler', () => ({
      ProgressHandler: class {
        increment() {}
        stop() {}
      }
    }));

    const warning = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), warning, error: jest.fn() }
    }));

    const { BatchProcessor } = await import('../../src/services/batch-processor');

    const promise = BatchProcessor.processBatches(
      [['a.css']],
      '/worker.js',
      { some: 'config' },
      { maxWorkers: 1, timeoutMs: 10 }
    );

    await Promise.resolve();

    // trigger timeout
    await jest.advanceTimersByTimeAsync(20);

    expect(warning).toHaveBeenCalled();
    expect(createdWorkers[0].terminate).toHaveBeenCalled();

    // end loop by emitting a message and letting polling finish
    createdWorkers[0].emit('message', { success: true, results: [] });
    await jest.advanceTimersByTimeAsync(200);

    await promise;

    // ensure exit clears timeout path is covered
    createdWorkers[0].emit('exit', 0);
  });

  it('uses default options and returns immediately for empty batches', async () => {
    await jest.unstable_mockModule('worker_threads', () => ({
      Worker: FakeWorker as any,
    }));

    const stop = jest.fn();
    await jest.unstable_mockModule('../../src/services/progress-handler', () => ({
      ProgressHandler: class {
        constructor() {}
        increment() {}
        stop = stop;
      }
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), warning: jest.fn(), error: jest.fn() }
    }));

    const { BatchProcessor } = await import('../../src/services/batch-processor');

    const results = await BatchProcessor.processBatches([], '/worker.js', { some: 'config' });
    expect(results).toEqual([]);
    expect(stop).toHaveBeenCalled();
  });

  it('terminates active workers in finally when polling throws', async () => {
    const createdWorkers: FakeWorker[] = [];

    await jest.unstable_mockModule('worker_threads', () => ({
      Worker: class extends FakeWorker {
        constructor(scriptPath: string, options: any) {
          super(scriptPath, options);
          createdWorkers.push(this);
        }
      },
    }));

    const stop = jest.fn();
    await jest.unstable_mockModule('../../src/services/progress-handler', () => ({
      ProgressHandler: class {
        constructor() {}
        increment() {}
        stop = stop;
      }
    }));

    const error = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { debug: jest.fn(), warning: jest.fn(), error }
    }));

    const originalSetTimeout = global.setTimeout;
    (global as any).setTimeout = (cb: any, ms?: any, ...args: any[]) => {
      // Throw only for the polling sleep in processBatches (setTimeout(resolve, 100))
      if (ms === 100) {
        throw new Error('polling failed');
      }
      return originalSetTimeout(cb, ms, ...args);
    };

    const { BatchProcessor } = await import('../../src/services/batch-processor');

    await expect(
      BatchProcessor.processBatches([['a.css']], '/worker.js', { some: 'config' }, { maxWorkers: 1, timeoutMs: 500 })
    ).rejects.toThrow('polling failed');

    // active worker should be terminated by finally cleanup
    expect(createdWorkers.length).toBeGreaterThanOrEqual(1);
    expect(createdWorkers[0].terminate).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();

    (global as any).setTimeout = originalSetTimeout;
  });
});
