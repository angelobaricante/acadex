import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { app } from "electron";

const PDF_SETTINGS = "/ebook";

function resolveBundledGhostscriptPath(): string {
    if (process.env.ACADEX_GS_BIN) {
        return process.env.ACADEX_GS_BIN;
    }

    const exeName = process.platform === "win32" ? "gswin64c.exe" : "gs";
    const rootPath = app.isPackaged
        ? path.join(process.resourcesPath, "binaries", "ghostscript")
        : path.resolve(process.cwd(), "electron", "binaries", "ghostscript");

    return path.join(rootPath, exeName);
}

function runGhostscript(binPath: string, inputPath: string, outputPath: string): Promise<void> {
    const args = [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        `-dPDFSETTINGS=${PDF_SETTINGS}`,
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${outputPath}`,
        inputPath,
    ];

    return new Promise((resolve, reject) => {
        execFile(binPath, args, { windowsHide: true }, (error, _stdout, stderr) => {
            if (error) {
                reject(new Error(`Ghostscript failed (${binPath}): ${stderr || error.message}`));
                return;
            }
            resolve();
        });
    });
}

export async function compressPdf(buffer: Buffer): Promise<Buffer> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "acadex-pdf-"));
    const inputPath = path.join(tempDir, "input.pdf");
    const outputPath = path.join(tempDir, "output.pdf");

    const candidates = [resolveBundledGhostscriptPath(), "gs", "gswin64c.exe"];

    await fs.writeFile(inputPath, buffer);

    let lastError: Error | null = null;
    for (const candidate of candidates) {
        try {
            await runGhostscript(candidate, inputPath, outputPath);
            const compressed = await fs.readFile(outputPath);
            await fs.rm(tempDir, { recursive: true, force: true });
            return compressed;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    await fs.rm(tempDir, { recursive: true, force: true });

    throw lastError ?? new Error("Ghostscript compression failed");
}
