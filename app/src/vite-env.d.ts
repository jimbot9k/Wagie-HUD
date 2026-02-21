/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svg' {
  const url: string;
  export default url;
}

declare const __PLATFORM__: 'desktop' | 'web';

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
