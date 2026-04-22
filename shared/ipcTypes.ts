export interface CompressFileArgs {
    fileName: string;
    mimeType: string;
    buffer: ArrayBuffer;
}

export interface CompressFileResult {
    compressedBytes: number[];
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
}

export interface AcaDexBridge {
    compressFile: (
        fileName: string,
        mimeType: string,
        buffer: ArrayBuffer
    ) => Promise<CompressFileResult>;
}
