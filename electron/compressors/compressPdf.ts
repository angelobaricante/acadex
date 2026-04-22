import { PDFDocument } from "pdf-lib";

export async function compressPdf(buffer: Buffer): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
    });

    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });

    return Buffer.from(compressedBytes);
}
