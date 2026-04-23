import type { CompressFileResult } from "../../../shared/ipcTypes";
import { PDFDocument } from "pdf-lib";
import { unzipSync, zipSync } from "fflate";
import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export interface RendererCompressionResult {
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
}

interface CompressFileOptions {
    allowLargerOutput?: boolean;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
}

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw (signal.reason instanceof Error ? signal.reason : undefined)
            ?? new DOMException("Aborted", "AbortError");
    }
}

const PPTX_MIME =
    "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isPdf(file: File): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return file.type === "application/pdf" || ext === "pdf";
}

function isOffice(file: File): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return file.type === PPTX_MIME || file.type === DOCX_MIME || ext === "pptx" || ext === "docx";
}

function isImage(file: File): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext);
}

function isVideo(file: File): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return file.type.startsWith("video/") || ["mp4", "mov", "mkv", "avi", "webm", "m4v"].includes(ext);
}

function withExtension(fileName: string, extension: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex < 0) {
        return `${fileName}.${extension}`;
    }
    return `${fileName.slice(0, dotIndex)}.${extension}`;
}

function isOfficeMediaImagePath(entryPath: string): boolean {
    const normalized = entryPath.replace(/\\/g, "/").toLowerCase();
    const inMediaFolder = normalized.startsWith("ppt/media/") || normalized.startsWith("word/media/");
    return inMediaFolder && (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || normalized.endsWith(".png"));
}

type FileCompressionOutput = {
    bytes: Uint8Array;
    fileName?: string;
    mimeType?: string;
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

let browserFfmpeg: FFmpeg | null = null;
let browserFfmpegLoaded = false;

async function getBrowserFfmpeg(): Promise<FFmpeg> {
    if (!browserFfmpeg) {
        browserFfmpeg = new FFmpeg();
    }

    if (!browserFfmpegLoaded) {
        await browserFfmpeg.load();
        browserFfmpegLoaded = true;
    }

    return browserFfmpeg;
}

async function compressPdfInBrowser(buffer: ArrayBuffer): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
    });

    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });

    return new Uint8Array(compressedBytes);
}

async function compressOfficeMediaImagesInBrowser(
    buffer: ArrayBuffer,
    signal?: AbortSignal
): Promise<Uint8Array> {
    const archive = unzipSync(new Uint8Array(buffer));

    for (const [entryPath, entryBytes] of Object.entries(archive)) {
        throwIfAborted(signal);
        if (!isOfficeMediaImagePath(entryPath)) {
            continue;
        }

        try {
            const entryName = entryPath.split("/").pop() ?? "image";
            const mimeType = entryPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            const sourceFile = new File([toArrayBuffer(entryBytes)], entryName, { type: mimeType });
            const compressedBlob = await imageCompression(sourceFile, {
                maxWidthOrHeight: 1920,
                initialQuality: 0.75,
                useWebWorker: true,
                fileType: mimeType,
                signal,
            });
            archive[entryPath] = new Uint8Array(await compressedBlob.arrayBuffer());
        } catch (error) {
            if ((error as { name?: string } | undefined)?.name === "AbortError") {
                throw error;
            }
            // Keep original bytes for this entry when image recompression fails.
        }
    }

    throwIfAborted(signal);
    return new Uint8Array(zipSync(archive, {
        level: 9,
        mem: 12,
    }));
}

async function compressImageInBrowser(
    file: File,
    signal?: AbortSignal
): Promise<FileCompressionOutput> {
    const lowerName = file.name.toLowerCase();
    const preferWebp = file.type === "image/png" || lowerName.endsWith(".png");
    const fileType = preferWebp ? "image/webp" : file.type || "image/jpeg";

    const compressedBlob = await imageCompression(file, {
        maxWidthOrHeight: 1920,
        initialQuality: 0.75,
        useWebWorker: true,
        fileType,
        signal,
    });

    return {
        bytes: new Uint8Array(await compressedBlob.arrayBuffer()),
        fileName: preferWebp ? withExtension(file.name, "webp") : file.name,
        mimeType: fileType,
    };
}

async function compressVideoInBrowser(
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
): Promise<FileCompressionOutput> {
    throwIfAborted(signal);
    const ffmpeg = await getBrowserFfmpeg();

    const inputName = `input${file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".mp4"}`;
    const outputName = "output.mp4";

    const progressHandler = (event: { progress: number }): void => {
        onProgress?.(Math.round(event.progress * 100));
    };

    ffmpeg.on("progress", progressHandler);

    // Terminate the wasm instance mid-execution on abort; the next call will
    // transparently re-create it.
    const onAbort = (): void => {
        try {
            ffmpeg.terminate();
        } catch {
            // ignore
        }
        browserFfmpeg = null;
        browserFfmpegLoaded = false;
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        await ffmpeg.exec([
            "-i",
            inputName,
            "-c:v",
            "libx264",
            "-crf",
            "28",
            "-preset",
            "medium",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            outputName,
        ]);

        throwIfAborted(signal);
        const output = await ffmpeg.readFile(outputName);

        if (!(output instanceof Uint8Array)) {
            throw new Error("Unexpected FFmpeg output format");
        }

        return {
            bytes: new Uint8Array(output),
            fileName: withExtension(file.name, "mp4"),
            mimeType: "video/mp4",
        };
    } finally {
        ffmpeg.off("progress", progressHandler);
        signal?.removeEventListener("abort", onAbort);
        throwIfAborted(signal);
    }
}

function buildResult(
    file: File,
    bytes: Uint8Array,
    originalSize: number,
    outputFileName?: string,
    outputMimeType?: string
): RendererCompressionResult {
    const compressedSize = bytes.byteLength;
    const savedPercent =
        originalSize === 0 ? 0 : Math.round(((originalSize - compressedSize) / originalSize) * 100);

    const finalType = outputMimeType ?? file.type;
    const finalName = outputFileName ?? file.name;

    const blob = new Blob([toArrayBuffer(bytes)], { type: finalType });
    const compressedFile = new File([blob], finalName, { type: finalType });

    return {
        compressedFile,
        originalSize,
        compressedSize,
        savedPercent,
    };
}

function logCompressionDetails(
    file: File,
    strategy: "pdf" | "office" | "image" | "video" | "passthrough",
    result: RendererCompressionResult,
    fallbackToOriginal: boolean,
    source: "web" | "electron-renderer"
): void {
    if (!import.meta.env.DEV) return;

    console.info("[acadex:compression]", {
        fileName: file.name,
        mimeType: file.type,
        strategy,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savedPercent: result.savedPercent,
        fallbackToOriginal,
        source,
    });
}

export async function compressFile(
    file: File,
    options: CompressFileOptions = {}
): Promise<RendererCompressionResult> {
    const { signal } = options;
    throwIfAborted(signal);

    const originalSize = file.size;
    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const allowLargerOutput = options.allowLargerOutput ?? false;
    throwIfAborted(signal);

    if (window.acadex) {
        let disposeProgressListener: (() => void) | null = null;
        const requestId = options.onProgress
            ? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
            : undefined;

        if (requestId && options.onProgress) {
            disposeProgressListener = window.acadex.onCompressionProgress((event) => {
                if (event.requestId !== requestId || event.fileName !== file.name) {
                    return;
                }
                options.onProgress?.(event.progress);
            });
        }

        try {
            throwIfAborted(signal);
            const result: CompressFileResult = await window.acadex.compressFile(
                file.name,
                file.type,
                originalBytes.buffer,
                allowLargerOutput,
                requestId
            );
            throwIfAborted(signal);

            const compressedBytes = new Uint8Array(result.compressedBytes);
            const output = buildResult(
                file,
                compressedBytes,
                result.originalSize,
                result.outputFileName,
                result.outputMimeType
            );
            logCompressionDetails(
                file,
                isPdf(file)
                    ? "pdf"
                    : isOffice(file)
                        ? "office"
                        : isImage(file)
                            ? "image"
                            : isVideo(file)
                                ? "video"
                                : "passthrough",
                output,
                output.compressedSize >= output.originalSize,
                "electron-renderer"
            );
            return output;
        } finally {
            disposeProgressListener?.();
        }
    }

    try {
        let compressedBytes: Uint8Array = originalBytes;
        let outputFileName: string | undefined;
        let outputMimeType: string | undefined;
        let strategy: "pdf" | "office" | "image" | "video" | "passthrough" = "passthrough";
        let fallbackToOriginal = false;

        if (isPdf(file)) {
            compressedBytes = await compressPdfInBrowser(originalBytes.buffer);
            strategy = "pdf";
        } else if (isOffice(file)) {
            compressedBytes = await compressOfficeMediaImagesInBrowser(originalBytes.buffer, signal);
            strategy = "office";
        } else if (isImage(file)) {
            const imageOutput = await compressImageInBrowser(file, signal);
            compressedBytes = imageOutput.bytes;
            outputFileName = imageOutput.fileName;
            outputMimeType = imageOutput.mimeType;
            strategy = "image";
        } else if (isVideo(file)) {
            const videoOutput = await compressVideoInBrowser(file, options.onProgress, signal);
            compressedBytes = videoOutput.bytes;
            outputFileName = videoOutput.fileName;
            outputMimeType = videoOutput.mimeType;
            strategy = "video";
        }

        throwIfAborted(signal);

        if (!allowLargerOutput && compressedBytes.byteLength > originalBytes.byteLength) {
            compressedBytes = originalBytes;
            fallbackToOriginal = true;
            outputFileName = file.name;
            outputMimeType = file.type;
        }

        const output = buildResult(file, compressedBytes, originalSize, outputFileName, outputMimeType);
        logCompressionDetails(file, strategy, output, fallbackToOriginal, "web");
        return output;
    } catch (error) {
        if ((error as { name?: string } | undefined)?.name === "AbortError") {
            throw error;
        }
        const output = buildResult(file, originalBytes, originalSize);
        logCompressionDetails(file, "passthrough", output, true, "web");
        return output;
    }
}
