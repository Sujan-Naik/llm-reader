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
      query: (string) => string;
  }
  // whatever else you exposed
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    versions: typeof versions;
    llm: typeof llm;
  }
}