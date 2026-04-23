import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { compressPdf } from "./compressors/compressPdf";
import { compressOffice } from "./compressors/compressOffice";
import { compressImage } from "./compressors/compressImage";
import { compressVideo } from "./compressors/compressVideo";
import type {
    CompressFileResult,
    CompressionProgressEvent,
    CompressionStrategy,
} from "../shared/ipcTypes";

const DEV_SERVER_URL = "http://localhost:5173";
const ENABLE_COMPRESSION_DEBUG_LOGS =
    process.env.ACADEX_DEBUG_COMPRESSION === "1" || !app.isPackaged;
const COMPRESSION_PROGRESS_CHANNEL = "compress-file-progress";

function hasExtension(fileName: string, extensions: string[]): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    return extensions.includes(ext);
}

function isImageInput(fileName: string, mimeType: string): boolean {
    return (
        mimeType.startsWith("image/") ||
        hasExtension(fileName, ["jpg", "jpeg", "png", "webp", "heic", "heif"])
    );
}

function isVideoInput(fileName: string, mimeType: string): boolean {
    return (
        mimeType.startsWith("video/") ||
        hasExtension(fileName, ["mp4", "mov", "mkv", "avi", "webm", "m4v"])
    );
}

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
        buffer: ArrayBuffer,
        allowLargerOutput = false,
        requestId?: string
    ): Promise<CompressFileResult> => {
        const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
        const inputBuffer = Buffer.from(new Uint8Array(buffer));
        let compressionStrategy: CompressionStrategy = "passthrough";
        let outputFileName = fileName;
        let outputMimeType = mimeType;

        const emitProgress = (strategy: CompressionStrategy, progress: number): void => {
            if (!requestId) {
                return;
            }

            const payload: CompressionProgressEvent = {
                requestId,
                fileName,
                strategy,
                progress,
            };

            _event.sender.send(COMPRESSION_PROGRESS_CHANNEL, payload);
        };

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
            outputBytes = await compressOffice(inputBuffer);
            compressionStrategy = "office";
        } else if (isImageInput(fileName, mimeType)) {
            const imageResult = await compressImage(inputBuffer, fileName, mimeType);
            outputBytes = imageResult.buffer;
            outputFileName = imageResult.outputFileName ?? fileName;
            outputMimeType = imageResult.outputMimeType ?? mimeType;
            compressionStrategy = "image";
        } else if (isVideoInput(fileName, mimeType)) {
            const videoResult = await compressVideo(inputBuffer, fileName, (progress) => {
                emitProgress("video", progress);
            });
            outputBytes = videoResult.buffer;
            outputFileName = videoResult.outputFileName ?? fileName;
            outputMimeType = videoResult.outputMimeType ?? mimeType;
            compressionStrategy = "video";
        }

        let fallbackToOriginal = false;
        if (!allowLargerOutput && outputBytes.byteLength > inputBuffer.byteLength) {
            outputBytes = inputBuffer;
            fallbackToOriginal = true;
            outputFileName = fileName;
            outputMimeType = mimeType;
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
            outputFileName,
            outputMimeType,
        };
    }
);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
