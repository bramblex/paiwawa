export type LevelLoadState = 'pending' | 'loading' | 'ready' | 'error';

export interface LevelLoadProgress {
  ratio: number;
  label?: string;
}

export type LevelLoadProgressListener = (progress: LevelLoadProgress) => void;

interface LoaderEntry<T> {
  state: LevelLoadState;
  value?: T;
  error?: unknown;
  progress: LevelLoadProgress;
  promise?: Promise<T>;
  token?: symbol;
  listeners: Set<LevelLoadProgressListener>;
}

export class ProgressiveLevelLoader<T> {
  private readonly entries: LoaderEntry<T>[];
  private disposed = false;

  constructor(
    count: number,
    private readonly load: (
      index: number,
      reportProgress: LevelLoadProgressListener,
    ) => Promise<T>,
  ) {
    if (!Number.isInteger(count) || count < 1) throw new RangeError('Level count must be a positive integer.');
    this.entries = Array.from({ length: count }, () => ({
      state: 'pending' as const,
      progress: { ratio: 0 },
      listeners: new Set<LevelLoadProgressListener>(),
    }));
  }

  get count(): number {
    return this.entries.length;
  }

  getState(index: number): LevelLoadState {
    return this.entry(index).state;
  }

  get(index: number): T | undefined {
    return this.entry(index).value;
  }

  async ensure(index: number, onProgress?: LevelLoadProgressListener): Promise<T> {
    if (this.disposed) throw new Error('Progressive level loader is disposed.');
    const entry = this.entry(index);
    if (entry.state === 'ready' && entry.value !== undefined) {
      onProgress?.({ ratio: 1, label: entry.progress.label });
      return entry.value;
    }

    if (onProgress) {
      entry.listeners.add(onProgress);
      onProgress({ ...entry.progress });
    }

    if (!entry.promise) {
      const token = Symbol(`level-${index}`);
      entry.token = token;
      entry.state = 'loading';
      entry.error = undefined;
      entry.progress = { ratio: 0 };
      this.emit(entry);

      entry.promise = this.load(index, (progress) => {
        if (this.disposed || entry.token !== token) return;
        entry.progress = {
          ratio: Math.max(0, Math.min(1, Number.isFinite(progress.ratio) ? progress.ratio : 0)),
          label: progress.label,
        };
        this.emit(entry);
      })
        .then((value) => {
          if (this.disposed || entry.token !== token) {
            throw new Error('Progressive level loader was disposed before the level became ready.');
          }
          entry.value = value;
          entry.state = 'ready';
          entry.progress = { ...entry.progress, ratio: 1 };
          this.emit(entry);
          return value;
        })
        .catch((error: unknown) => {
          if (!this.disposed && entry.token === token) {
            entry.state = 'error';
            entry.error = error;
          }
          throw error;
        })
        .finally(() => {
          if (entry.token === token) {
            entry.promise = undefined;
            entry.token = undefined;
          }
        });
    }

    try {
      return await entry.promise;
    } finally {
      if (onProgress) entry.listeners.delete(onProgress);
    }
  }

  async preloadRemaining(startIndex = 1): Promise<void> {
    for (let index = Math.max(0, Math.trunc(startIndex)); index < this.entries.length; index += 1) {
      if (this.disposed) return;
      try {
        await this.ensure(index);
      } catch (error) {
        if (this.disposed) return;
        console.warn(`Background loading failed for level ${index + 1}. It will retry when requested.`, error);
      }
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.entries) {
      entry.listeners.clear();
      entry.token = undefined;
    }
  }

  private entry(index: number): LoaderEntry<T> {
    if (!Number.isInteger(index) || index < 0 || index >= this.entries.length) {
      throw new RangeError(`Unknown level index: ${index}`);
    }
    return this.entries[index];
  }

  private emit(entry: LoaderEntry<T>): void {
    const progress = { ...entry.progress };
    for (const listener of entry.listeners) listener(progress);
  }
}
