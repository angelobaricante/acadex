import path from "path";
import sharp from "sharp";
import type { BinaryCompressionResult } from "./types";

function withExtension(fileName: string, extension: string): string {
    const parsed = path.parse(fileName);
    return `${parsed.name}.${extension}`;
}

export async function compressImage(
    buffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<BinaryCompressionResult> {
    const lowerName = fileName.toLowerCase();
    const isPng = mimeType === "image/png" || lowerName.endsWith(".png");
    const isJpeg =
        mimeType === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");

    if (isPng) {
        const output = await sharp(buffer, { failOn: "none" })
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

        return {
            buffer: output,
            outputFileName: withExtension(fileName, "webp"),
            outputMimeType: "image/webp",
        };
    }

    if (isJpeg) {
        const output = await sharp(buffer, { failOn: "none" })
            .resize({ width: 1920, withoutEnlargement: true })
            .jpeg({ quality: 75, mozjpeg: true })
            .toBuffer();

        return {
            buffer: output,
            outputFileName: withExtension(fileName, "jpg"),
            outputMimeType: "image/jpeg",
        };
    }

    const output = await sharp(buffer, { failOn: "none" })
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

    return {
        buffer: output,
        outputFileName: withExtension(fileName, "webp"),
        outputMimeType: "image/webp",
    };
}
