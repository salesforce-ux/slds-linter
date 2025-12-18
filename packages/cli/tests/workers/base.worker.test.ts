import { jest } from '@jest/globals';

describe('BaseWorker', () => {
  const originalExit = process.exit;

  beforeEach(() => {
    jest.resetModules();
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    process.exit = originalExit;
  });

  it('posts success with results and includes per-file error objects', async () => {
    const postMessage = jest.fn();

    await jest.unstable_mockModule('worker_threads', () => ({
      parentPort: { postMessage },
      workerData: {
        files: ['a.css', 'b.css'],
        config: {},
      },
    }));

    const { BaseWorker } = await import('../../src/workers/base.worker');

    class TestWorker extends (BaseWorker as any) {
      protected async processFile(filePath: string): Promise<any> {
        if (filePath === 'b.css') {
          throw new Error('boom');
        }
        return { filePath, ok: true };
      }
    }

    const worker = new TestWorker();
    await worker.process();

    expect(postMessage).toHaveBeenCalledWith({
      success: true,
      results: [
        { filePath: 'a.css', ok: true },
        { file: 'b.css', error: 'boom' },
      ],
    });

    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('posts failure when worker-level processing throws', async () => {
    const postMessage = jest.fn();

    await jest.unstable_mockModule('worker_threads', () => ({
      parentPort: { postMessage },
      // files is missing => for..of will throw and hit outer catch
      workerData: {
        config: {},
      },
    }));

    const { BaseWorker } = await import('../../src/workers/base.worker');

    class TestWorker extends (BaseWorker as any) {
      protected async processFile(_filePath: string): Promise<any> {
        return { ok: true };
      }
    }

    const worker = new TestWorker();
    await worker.process();

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        results: [],
      })
    );
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
