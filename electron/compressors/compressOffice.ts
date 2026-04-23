import { unzipSync, zipSync } from "fflate";
import sharp from "sharp";

function isOfficeMediaImagePath(entryPath: string): boolean {
    const normalized = entryPath.replace(/\\/g, "/").toLowerCase();
    const inOfficeMedia =
        normalized.startsWith("ppt/media/") || normalized.startsWith("word/media/");
    return inOfficeMedia && (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || normalized.endsWith(".png"));
}

async function recompressImageBytes(entryPath: string, input: Uint8Array): Promise<Uint8Array> {
    const normalized = entryPath.toLowerCase();
    const image = sharp(Buffer.from(input), { failOn: "none" }).resize({
        width: 1920,
        withoutEnlargement: true,
    });

    if (normalized.endsWith(".png")) {
        const output = await image.png({ compressionLevel: 9, palette: true }).toBuffer();
        return new Uint8Array(output);
    }

    const output = await image.jpeg({ quality: 75, mozjpeg: true }).toBuffer();
    return new Uint8Array(output);
}

export async function compressOffice(buffer: Buffer): Promise<Buffer> {
    const unzipped = unzipSync(new Uint8Array(buffer));

    const entries = Object.entries(unzipped);
    for (const [entryPath, entryBytes] of entries) {
        if (!isOfficeMediaImagePath(entryPath)) {
            continue;
        }

        try {
            unzipped[entryPath] = await recompressImageBytes(entryPath, entryBytes);
        } catch {
            // Preserve the original entry when recompression fails.
        }
    }

    const recompressed = zipSync(unzipped, {
        level: 9,
        mem: 12,
    });

    return Buffer.from(recompressed);
}
