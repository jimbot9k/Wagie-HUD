import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorage } from '../storage';

describe('LocalStorage', () => {
  let store: LocalStorage;

  beforeEach(() => {
    // Provide a fresh in-memory localStorage per test.
    // Vitest's jsdom shim does not expose all Storage methods in every
    // configuration, so we stub it completely to avoid flakiness.
    const data: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data[k] ?? null,
      setItem: (k: string, v: string) => {
        data[k] = v;
      },
      removeItem: (k: string) => {
        delete data[k];
      },
      clear: () => {
        for (const k in data) delete data[k];
      },
    });
    store = new LocalStorage();
  });

  afterEach(() => vi.unstubAllGlobals());

  describe('set() and get()', () => {
    it('round-trips a plain string value', () => {
      store.set('key', 'hello');
      expect(store.get<string>('key')).toBe('hello');
    });

    it('round-trips a number', () => {
      store.set('n', 42.5);
      expect(store.get<number>('n')).toBe(42.5);
    });

    it('round-trips a nested object', () => {
      const obj = { a: 1, b: { c: [1, 2, 3] } };
      store.set('obj', obj);
      expect(store.get<typeof obj>('obj')).toEqual(obj);
    });

    it('round-trips a null value stored explicitly', () => {
      store.set('n', null);
      expect(store.get<null>('n')).toBeNull();
    });

    it('returns null for an unknown key', () => {
      expect(store.get('does-not-exist')).toBeNull();
    });

    it('returns null when the stored JSON is malformed', () => {
      localStorage.setItem('bad', '{not valid json');
      expect(store.get('bad')).toBeNull();
    });

    it('overwrites an existing value on subsequent set()', () => {
      store.set('k', 1);
      store.set('k', 2);
      expect(store.get<number>('k')).toBe(2);
    });
  });

  describe('remove()', () => {
    it('deletes a key so get() returns null afterwards', () => {
      store.set('x', 'value');
      store.remove('x');
      expect(store.get('x')).toBeNull();
    });

    it('is a no-op when the key does not exist', () => {
      expect(() => store.remove('missing')).not.toThrow();
    });
  });

  describe('isolation between instances', () => {
    it('two instances share the same underlying localStorage', () => {
      const storeA = new LocalStorage();
      const storeB = new LocalStorage();
      storeA.set('shared', 99);
      expect(storeB.get<number>('shared')).toBe(99);
    });
  });
});
