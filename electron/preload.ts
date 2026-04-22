import { contextBridge, ipcRenderer } from "electron";
import type { AcaDexBridge, CompressFileResult } from "../shared/ipcTypes";

const bridge: AcaDexBridge = {
    compressFile: (
        fileName: string,
        mimeType: string,
        buffer: ArrayBuffer,
        allowLargerOutput = false
    ): Promise<CompressFileResult> =>
        ipcRenderer.invoke("compress-file", fileName, mimeType, buffer, allowLargerOutput),
};

contextBridge.exposeInMainWorld("acadex", bridge);
