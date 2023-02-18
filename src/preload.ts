import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  invoke: (chanel: string, ...datas: any) =>
    ipcRenderer.invoke(chanel, ...datas),
});
