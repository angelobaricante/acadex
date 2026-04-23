import { contextBridge, ipcRenderer } from "electron";
import type {
    AcaDexBridge,
    CompressFileResult,
    CompressionProgressEvent,
} from "../shared/ipcTypes";

const COMPRESSION_PROGRESS_CHANNEL = "compress-file-progress";

const bridge: AcaDexBridge = {
    compressFile: (
        fileName: string,
        mimeType: string,
        buffer: ArrayBuffer,
        allowLargerOutput = false,
        requestId?: string
    ): Promise<CompressFileResult> =>
        ipcRenderer.invoke(
            "compress-file",
            fileName,
            mimeType,
            buffer,
            allowLargerOutput,
            requestId
        ),
    onCompressionProgress: (listener: (event: CompressionProgressEvent) => void): (() => void) => {
        const wrapped = (_event: Electron.IpcRendererEvent, payload: CompressionProgressEvent): void => {
            listener(payload);
        };
        ipcRenderer.on(COMPRESSION_PROGRESS_CHANNEL, wrapped);
        return (): void => {
            ipcRenderer.removeListener(COMPRESSION_PROGRESS_CHANNEL, wrapped);
        };
    },
};

contextBridge.exposeInMainWorld("acadex", bridge);
