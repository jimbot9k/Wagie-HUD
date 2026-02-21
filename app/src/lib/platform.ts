/**
 * Platform detection utilities for desktop/web dual deployment
 */

export enum Platform {
  Desktop = 'desktop',
  Web = 'web',
}

/**
 * Returns the current platform as a Platform enum value.
 * In production builds the value is injected at build time via __PLATFORM__.
 * Falls back to runtime detection when the constant is not defined.
 */
export function getPlatform(): Platform {
  if (typeof __PLATFORM__ !== 'undefined') {
    return __PLATFORM__ as Platform;
  }
  // Runtime fallback: Wails exposes window.go
  if (typeof window !== 'undefined' && typeof window.go !== 'undefined') {
    return Platform.Desktop;
  }
  return Platform.Web;
}

/** Convenience: true when running inside the Wails desktop shell */
export function isDesktop(): boolean {
  return getPlatform() === Platform.Desktop;
}

/** Convenience: true when running in a web browser */
export function isWeb(): boolean {
  return getPlatform() === Platform.Web;
}

/** Execute callback only in the desktop environment */
export function onDesktop<T>(callback: () => T): T | undefined {
  if (isDesktop()) return callback();
  return undefined;
}

/** Execute callback only in the web environment */
export function onWeb<T>(callback: () => T): T | undefined {
  if (isWeb()) return callback();
  return undefined;
}
