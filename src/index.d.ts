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
    query: (req: string) => Promise<string>;
  };
  windowControl: {
    setIgnoreMouseEvents: (ignore: boolean) => void;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    versions: IElectronAPI['versions'];
    llm: IElectronAPI['llm'];
    windowControl: IElectronAPI['windowControl'];
  }
}

export {};