import { describe, expect, it, vi } from 'vitest';

import { ProgressiveLevelLoader } from './progressive-level-loader';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('ProgressiveLevelLoader', () => {
  it('coalesces duplicate requests and broadcasts progress', async () => {
    const pending = deferred<string>();
    const load = vi.fn(async (_index: number, report: (progress: { ratio: number }) => void) => {
      report({ ratio: 0.45 });
      return pending.promise;
    });
    const loader = new ProgressiveLevelLoader(2, load);
    const progress: number[] = [];

    const first = loader.ensure(1, (event) => progress.push(event.ratio));
    const second = loader.ensure(1);
    pending.resolve('ready');

    await expect(first).resolves.toBe('ready');
    await expect(second).resolves.toBe('ready');
    expect(load).toHaveBeenCalledTimes(1);
    expect(progress).toContain(0.45);
    expect(progress.at(-1)).toBe(1);
    expect(loader.getState(1)).toBe('ready');
  });

  it('preloads levels sequentially in campaign order', async () => {
    const order: number[] = [];
    let activeLoads = 0;
    let maxActiveLoads = 0;
    const loader = new ProgressiveLevelLoader(4, async (index) => {
      order.push(index);
      activeLoads += 1;
      maxActiveLoads = Math.max(maxActiveLoads, activeLoads);
      await Promise.resolve();
      activeLoads -= 1;
      return index;
    });

    await loader.preloadRemaining(1);
    expect(order).toEqual([1, 2, 3]);
    expect(maxActiveLoads).toBe(1);
  });

  it('retries a level after a failed background request', async () => {
    let attempts = 0;
    const loader = new ProgressiveLevelLoader(1, async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('network');
      return 'recovered';
    });

    await expect(loader.ensure(0)).rejects.toThrow('network');
    expect(loader.getState(0)).toBe('error');
    await expect(loader.ensure(0)).resolves.toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('rejects new requests after disposal', async () => {
    const loader = new ProgressiveLevelLoader(1, async () => 'unused');
    loader.dispose();
    await expect(loader.ensure(0)).rejects.toThrow('disposed');
  });
});
