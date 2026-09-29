export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  version: string;
  appVersion: string;
  print: (options?: any) => void;
  printToPDF: (options?: any) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  openExternal: (url: string) => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  showNotification: (payload: { title: string; body: string }) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
