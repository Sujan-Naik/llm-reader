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
  // direct toggle
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.send('set-ignore-mouse-events', ignore),

  // request a timed pass-through handled in main
  requestClickThrough: () =>
    ipcRenderer.send('request-click-through'),
});

contextBridge.exposeInMainWorld('electronAPI', {
  onClipboardText: (callback: (text: string) => void) =>
    ipcRenderer.on('clipboard-text', (_, text) => callback(text)),
});