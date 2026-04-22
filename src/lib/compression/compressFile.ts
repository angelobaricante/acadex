import type { CompressFileResult } from "../../../shared/ipcTypes";
import { PDFDocument } from "pdf-lib";
import { unzipSync, zipSync } from "fflate";

export interface RendererCompressionResult {
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
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

async function compressPdfInBrowser(buffer: ArrayBuffer): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
    });

    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });

    return compressedBytes;
}

function compressOfficeInBrowser(buffer: ArrayBuffer): Uint8Array {
    const unzipped = unzipSync(new Uint8Array(buffer));
    return zipSync(unzipped, {
        level: 9,
        mem: 12,
    });
}

function buildResult(file: File, bytes: Uint8Array, originalSize: number): RendererCompressionResult {
    const compressedSize = bytes.byteLength;
    const savedPercent =
        originalSize === 0 ? 0 : Math.round(((originalSize - compressedSize) / originalSize) * 100);

    const blob = new Blob([bytes], { type: file.type });
    const compressedFile = new File([blob], file.name, { type: file.type });

    return {
        compressedFile,
        originalSize,
        compressedSize,
        savedPercent,
    };
}

function logCompressionDetails(
    file: File,
    strategy: "pdf" | "office" | "passthrough",
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

export async function compressFile(file: File): Promise<RendererCompressionResult> {
    const originalSize = file.size;
    const originalBytes = new Uint8Array(await file.arrayBuffer());

    if (window.acadex) {
        const result: CompressFileResult = await window.acadex.compressFile(
            file.name,
            file.type,
            originalBytes.buffer
        );

        const compressedBytes = new Uint8Array(result.compressedBytes);
        const output = buildResult(file, compressedBytes, result.originalSize);
        logCompressionDetails(
            file,
            isPdf(file) ? "pdf" : isOffice(file) ? "office" : "passthrough",
            output,
            output.compressedSize >= output.originalSize,
            "electron-renderer"
        );
        return output;
    }

    try {
        let compressedBytes = originalBytes;
        let strategy: "pdf" | "office" | "passthrough" = "passthrough";
        let fallbackToOriginal = false;

        if (isPdf(file)) {
            compressedBytes = await compressPdfInBrowser(originalBytes.buffer);
            strategy = "pdf";
        } else if (isOffice(file)) {
            compressedBytes = compressOfficeInBrowser(originalBytes.buffer);
            strategy = "office";
        }

        if (compressedBytes.byteLength > originalBytes.byteLength) {
            compressedBytes = originalBytes;
            fallbackToOriginal = true;
        }

        const output = buildResult(file, compressedBytes, originalSize);
        logCompressionDetails(file, strategy, output, fallbackToOriginal, "web");
        return output;
    } catch {
        const output = buildResult(file, originalBytes, originalSize);
        logCompressionDetails(file, "passthrough", output, true, "web");
        return output;
    }
}
