import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})


contextBridge.exposeInMainWorld('llm', {
  query: (req: string) => ipcRenderer.invoke('query', req)
})

contextBridge.exposeInMainWorld('windowControl', {
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },
});

contextBridge.exposeInMainWorld('electronAPI', {
  onClipboardText: (callback: (text: string) => void) =>
    ipcRenderer.on('clipboard-text', (_, text) => callback(text)),
});