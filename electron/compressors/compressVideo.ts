import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import type { BinaryCompressionResult } from "./types";

function toSeconds(hours: number, minutes: number, seconds: number): number {
    return hours * 3600 + minutes * 60 + seconds;
}

function parseDurationSeconds(line: string): number | null {
    const match = /Duration:\s(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(line);
    if (!match) {
        return null;
    }

    return toSeconds(Number(match[1]), Number(match[2]), Number(match[3]));
}

function pickFfmpegPath(): string {
    if (process.env.ACADEX_FFMPEG_BIN) {
        return process.env.ACADEX_FFMPEG_BIN;
    }

    if (!ffmpegPath) {
        throw new Error("Unable to resolve ffmpeg-static binary path");
    }

    return ffmpegPath;
}

function outputNameFromInput(fileName: string): string {
    const parsed = path.parse(fileName);
    return `${parsed.name}.mp4`;
}

export async function compressVideo(
    buffer: Buffer,
    fileName: string,
    onProgress?: (progress: number) => void
): Promise<BinaryCompressionResult> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "acadex-video-"));
    const inputPath = path.join(tmpDir, `input${path.extname(fileName) || ".mp4"}`);
    const outputPath = path.join(tmpDir, "output.mp4");

    await fs.writeFile(inputPath, buffer);

    const ffmpegBin = pickFfmpegPath();

    await new Promise<void>((resolve, reject) => {
        const args = [
            "-y",
            "-i",
            inputPath,
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
            "-progress",
            "pipe:1",
            "-nostats",
            outputPath,
        ];

        const proc = spawn(ffmpegBin, args, { windowsHide: true });
        let durationSeconds = 0;
        let stderrContent = "";

        proc.stdout.setEncoding("utf8");
        proc.stderr.setEncoding("utf8");

        proc.stderr.on("data", (chunk: string) => {
            stderrContent += chunk;
            const maybeDuration = parseDurationSeconds(chunk);
            if (maybeDuration && maybeDuration > 0) {
                durationSeconds = maybeDuration;
            }
        });

        proc.stdout.on("data", (chunk: string) => {
            if (!durationSeconds) {
                return;
            }

            const lines = chunk.split(/\r?\n/);
            for (const line of lines) {
                if (!line.startsWith("out_time_ms=")) {
                    continue;
                }

                const micros = Number(line.slice("out_time_ms=".length));
                if (!Number.isFinite(micros) || micros <= 0) {
                    continue;
                }

                const progress = Math.max(
                    0,
                    Math.min(99, Math.round((micros / 1_000_000 / durationSeconds) * 100))
                );
                onProgress?.(progress);
            }
        });

        proc.on("error", (error) => {
            reject(error);
        });

        proc.on("close", (code) => {
            if (code === 0) {
                onProgress?.(100);
                resolve();
                return;
            }
            reject(new Error(`ffmpeg exited with code ${code}: ${stderrContent}`));
        });
    });

    const compressed = await fs.readFile(outputPath);
    await fs.rm(tmpDir, { recursive: true, force: true });

    return {
        buffer: compressed,
        outputFileName: outputNameFromInput(fileName),
        outputMimeType: "video/mp4",
    };
}
