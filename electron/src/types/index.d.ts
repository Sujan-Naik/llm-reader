export interface IElectronAPI {
  getSelectedText: () => Promise<string>;
  expandText: (text: string) => Promise<string>;
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
    ping: () => string;
  };
  llm: {
      query: (args: any) => Promise<{
        content: string;
        usage: {
          inputTokens: number;
          outputTokens: number;
          totalTokens: number;
          inputCost: number;
          outputCost: number;
          totalCost: number;
          latencyMs: number;
          model: string;
        };
        chunks: string[];
      }>;
    };
  windowControl: {
    setIgnoreMouseEvents: (ignore: boolean) => void;
    requestClickThrough: () => void;
  };
   electronAPI: {
      onClipboardText: (callback: (text: string) => void) => void;
    };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI['electronAPI'];
    versions: IElectronAPI['versions'];
    llm: IElectronAPI['llm'];
    windowControl: IElectronAPI['windowControl'];
  }
}

export {};