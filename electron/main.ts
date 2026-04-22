import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { compressPdf } from "./compressors/compressPdf";
import { compressOffice } from "./compressors/compressOffice";
import type { CompressFileResult } from "../shared/ipcTypes";

const DEV_SERVER_URL = "http://localhost:5173";
const ENABLE_COMPRESSION_DEBUG_LOGS =
    process.env.ACADEX_DEBUG_COMPRESSION === "1" || !app.isPackaged;

function createWindow(): void {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (!app.isPackaged) {
        win.loadURL(DEV_SERVER_URL).catch(() => {
            setTimeout(() => {
                void win.loadURL(DEV_SERVER_URL);
            }, 1000);
        });
        return;
    }

    void win.loadFile(path.join(__dirname, "../../dist/index.html"));
}

ipcMain.handle(
    "compress-file",
    async (
        _event,
        fileName: string,
        mimeType: string,
        buffer: ArrayBuffer
    ): Promise<CompressFileResult> => {
        const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
        const inputBuffer = Buffer.from(new Uint8Array(buffer));
        let compressionStrategy = "passthrough";

        let outputBytes: Uint8Array = inputBuffer;

        if (mimeType === "application/pdf" || ext === "pdf") {
            outputBytes = await compressPdf(inputBuffer);
            compressionStrategy = "pdf";
        } else if (
            ext === "pptx" ||
            ext === "docx" ||
            mimeType ===
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
            mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            outputBytes = compressOffice(inputBuffer);
            compressionStrategy = "office";
        }

        let fallbackToOriginal = false;
        if (outputBytes.byteLength > inputBuffer.byteLength) {
            outputBytes = inputBuffer;
            fallbackToOriginal = true;
        }

        const compressedBuffer = Buffer.from(outputBytes);

        const originalSize = inputBuffer.length;
        const compressedSize = compressedBuffer.length;
        const savedPercent =
            originalSize === 0
                ? 0
                : Math.round(((originalSize - compressedSize) / originalSize) * 100);

        if (ENABLE_COMPRESSION_DEBUG_LOGS) {
            console.info("[acadex:compression]", {
                fileName,
                mimeType,
                strategy: compressionStrategy,
                originalSize,
                compressedSize,
                savedPercent,
                fallbackToOriginal,
            });
        }

        return {
            compressedBytes: Array.from(compressedBuffer),
            originalSize,
            compressedSize,
            savedPercent,
        };
    }
);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
