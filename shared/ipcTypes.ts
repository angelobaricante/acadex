export interface CompressFileArgs {
    fileName: string;
    mimeType: string;
    buffer: ArrayBuffer;
    allowLargerOutput?: boolean;
    requestId?: string;
}

export interface CompressFileResult {
    compressedBytes: number[];
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
    outputFileName?: string;
    outputMimeType?: string;
}

export type CompressionStrategy = "pdf" | "office" | "image" | "video" | "passthrough";

export interface CompressionProgressEvent {
    requestId: string;
    fileName: string;
    strategy: CompressionStrategy;
    progress: number;
}

export interface AcaDexBridge {
    compressFile: (
        fileName: string,
        mimeType: string,
        buffer: ArrayBuffer,
        allowLargerOutput?: boolean,
        requestId?: string
    ) => Promise<CompressFileResult>;
    onCompressionProgress: (listener: (event: CompressionProgressEvent) => void) => () => void;
}
