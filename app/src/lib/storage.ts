/**
 * Storage abstraction layer.
 * IStorage is the interface both Web (localStorage) and Desktop implementations honour.
 * The Desktop Wails build currently delegates to the same localStorage that is available
 * inside the WebKit webview, but the interface makes it trivial to swap in a Go-backed
 * persistent store later without touching any other code.
 */

export interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class LocalStorage implements IStorage {
  get<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  }
}

/**
 * Desktop Wails wrapper. Currently identical to LocalStorage because Wails exposes
 * localStorage inside its WebKit webview. Override methods here to call Go bindings
 * (e.g. window.go.main.App.GetConfig / SetConfig) if a native store is desired.
 */
class DesktopStorage extends LocalStorage {}

import { isDesktop } from './platform';

export const storage: IStorage = isDesktop() ? new DesktopStorage() : new LocalStorage();
