/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __IS_WAILS__: boolean;
declare const __IS_WEB__: boolean;

interface Window {
  go?: {
    main: {
      App: {
        Greet(name: string): Promise<string>;
        GetSystemInfo(): Promise<SystemInfo>;
      };
    };
  };
  runtime?: typeof import('@anthropic-ai/wails-runtime');
}

interface SystemInfo {
  os: string;
  arch: string;
  hostname: string;
}
