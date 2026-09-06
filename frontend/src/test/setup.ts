import { beforeEach } from 'vitest';

// React 19 refuses to flush updates outside act() without this.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * A working `localStorage` for the tests.
 *
 * Node 24+ exposes a `localStorage` global of its own, and with no backing
 * file it is an inert object with no `setItem`; under vitest's jsdom
 * environment `window` *is* `globalThis`, so jsdom's Storage never gets a
 * look in and `window.localStorage` is that same stub. Rather than depend on
 * which of the two wins on a given Node version, install a plain in-memory
 * Storage. The code under test only ever uses the Storage API, which is what
 * this provides and what these tests are actually about.
 */
class MemoryStorage implements Storage {
  private entries = new Map<string, string>();

  get length() {
    return this.entries.size;
  }
  clear() {
    this.entries.clear();
  }
  getItem(key: string) {
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }
  key(index: number) {
    return [...this.entries.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.entries.delete(key);
  }
  setItem(key: string, value: string) {
    this.entries.set(key, String(value));
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  const storage = new MemoryStorage();
  for (const target of new Set<object>([globalThis, globalThis.window ?? globalThis])) {
    Object.defineProperty(target, name, { configurable: true, value: storage });
  }
}

// Each test starts from an empty browser.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
