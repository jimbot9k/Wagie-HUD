import { describe, it, expect, vi } from 'vitest';
import * as platformModule from '../platform';
import { Platform } from '../platform';

describe('Platform enum', () => {
  it('defines Desktop and Web values', () => {
    expect(Platform.Desktop).toBe('desktop');
    expect(Platform.Web).toBe('web');
  });
});

describe('getPlatform()', () => {
  it('returns Platform.Web when __PLATFORM__ define equals "web"', () => {
    // In vitest.config.ts, __PLATFORM__ is set to "web"
    expect(platformModule.getPlatform()).toBe(Platform.Web);
  });
});

// isWeb / isDesktop / onWeb / onDesktop are tested in the 'web' build context
// (__PLATFORM__ define = 'web'). ESM live-binding semantics prevent spying on
// getPlatform() from inside its own module, so we only test the observable
// outcomes in the environment that the test suite actually runs in.
describe('isWeb() and isDesktop() in web context', () => {
  it('isWeb() returns true', () => {
    expect(platformModule.isWeb()).toBe(true);
  });

  it('isDesktop() returns false', () => {
    expect(platformModule.isDesktop()).toBe(false);
  });
});

describe('onWeb() in web context', () => {
  it('calls the callback and returns its result', () => {
    const fn = vi.fn(() => 42);
    const result = platformModule.onWeb(fn);
    expect(fn).toHaveBeenCalledOnce();
    expect(result).toBe(42);
  });
});

describe('onDesktop() in web context', () => {
  it('does not call the callback and returns undefined', () => {
    const fn = vi.fn(() => 'hello');
    const result = platformModule.onDesktop(fn);
    expect(fn).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
