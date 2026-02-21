import { afterEach, vi } from 'vitest';

// Ensure fake timers are restored and storage is cleared after every test.
afterEach(() => {
  vi.useRealTimers();
  try {
    localStorage.clear();
  } catch {
    // jsdom may not expose localStorage in all environments
  }
});
