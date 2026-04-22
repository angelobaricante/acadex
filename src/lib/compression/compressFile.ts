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
        return buildResult(file, compressedBytes, result.originalSize);
    }

    try {
        let compressedBytes = originalBytes;

        if (isPdf(file)) {
            compressedBytes = await compressPdfInBrowser(originalBytes.buffer);
        } else if (isOffice(file)) {
            compressedBytes = compressOfficeInBrowser(originalBytes.buffer);
        }

        if (compressedBytes.byteLength > originalBytes.byteLength) {
            compressedBytes = originalBytes;
        }

        return buildResult(file, compressedBytes, originalSize);
    } catch {
        return buildResult(file, originalBytes, originalSize);
    }
}
