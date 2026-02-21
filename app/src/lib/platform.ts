/**
 * Platform detection utilities for Wails/Web dual deployment
 */

/**
 * Check if running inside Wails desktop application
 */
export function isWails(): boolean {
  if (typeof __IS_WAILS__ !== 'undefined') {
    return __IS_WAILS__;
  }
  return typeof window !== 'undefined' && typeof window.go !== 'undefined';
}

/**
 * Check if running in web browser
 */
export function isWeb(): boolean {
  return !isWails();
}

/**
 * Execute callback only in Wails environment
 */
export function onWails<T>(callback: () => T): T | undefined {
  if (isWails()) {
    return callback();
  }
  return undefined;
}

/**
 * Execute callback only in web environment
 */
export function onWeb<T>(callback: () => T): T | undefined {
  if (isWeb()) {
    return callback();
  }
  return undefined;
}
