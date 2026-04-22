import { unzipSync, zipSync } from "fflate";

export function compressOffice(buffer: Buffer): Buffer {
    const unzipped = unzipSync(new Uint8Array(buffer));

    const recompressed = zipSync(unzipped, {
        level: 9,
        mem: 12,
    });

    return Buffer.from(recompressed);
}
