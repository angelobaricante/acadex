import { describe, it, expect, beforeEach } from "vitest";
import {
  listFiles,
  getFile,
  mockSignIn,
  listFolders,
  getFolder,
  createFolder,
  moveFileToFolder,
  deleteFolder,
  __resetApiStateForTests,
} from "./api";

beforeEach(() => {
  __resetApiStateForTests();
});

describe("listFiles", () => {
  it("returns all files with no params", async () => {
    const files = await listFiles();
    expect(files.length).toBeGreaterThan(0);
  });

  it("filters by kind", async () => {
    const files = await listFiles({ kind: "pdf" });
    expect(files.every((f) => f.kind === "pdf")).toBe(true);
  });

  it("filters by tag (case-insensitive)", async () => {
    const files = await listFiles({ tag: "cs101" });
    expect(files.every((f) => f.tags.some((t) => t.toLowerCase() === "cs101"))).toBe(true);
  });

  it("filters by query on name (case-insensitive)", async () => {
    const files = await listFiles({ query: "thesis" });
    expect(files.every((f) => f.name.toLowerCase().includes("thesis"))).toBe(true);
  });

  it("sorts by largest original bytes", async () => {
    const files = await listFiles({ sort: "largest" });
    for (let i = 1; i < files.length; i += 1) {
      expect(files[i - 1].originalBytes).toBeGreaterThanOrEqual(files[i].originalBytes);
    }
  });

  it("sorts by most saved (absolute bytes saved)", async () => {
    const files = await listFiles({ sort: "most_saved" });
    const saved = (f: { originalBytes: number; storedBytes: number }) =>
      f.originalBytes - f.storedBytes;
    for (let i = 1; i < files.length; i += 1) {
      expect(saved(files[i - 1])).toBeGreaterThanOrEqual(saved(files[i]));
    }
  });
});

describe("getFile", () => {
  it("returns a file by id", async () => {
    const file = await getFile("file_001");
    expect(file.id).toBe("file_001");
  });

  it("throws when id is unknown", async () => {
    await expect(getFile("nope")).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("mockSignIn", () => {
  it("returns the student user for 'student' role", async () => {
    const user = await mockSignIn("student");
    expect(user.role).toBe("student");
  });
});

describe("folders", () => {
  it("listFolders returns seeded folders", async () => {
    const fs = await listFolders();
    expect(fs.length).toBeGreaterThanOrEqual(4);
    expect(fs.some((f) => f.id === "folder_cs101")).toBe(true);
  });

  it("getFolder throws when missing", async () => {
    await expect(getFolder("nope")).rejects.toMatchObject({ code: "not_found" });
  });

  it("createFolder adds to the list", async () => {
    const before = (await listFolders()).length;
    const f = await createFolder("New Folder");
    expect(f.name).toBe("New Folder");
    const after = await listFolders();
    expect(after.length).toBe(before + 1);
    expect(after.some((x) => x.id === f.id)).toBe(true);
  });

  it("listFiles filters by folderId", async () => {
    const files = await listFiles({ folderId: "folder_cs101" });
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.folderId === "folder_cs101")).toBe(true);
  });

  it("listFiles filters by folderId === null (root)", async () => {
    const files = await listFiles({ folderId: null });
    expect(files.every((f) => !f.folderId)).toBe(true);
  });

  it("moveFileToFolder updates the file", async () => {
    const moved = await moveFileToFolder("file_008", "folder_admin");
    expect(moved.folderId).toBe("folder_admin");
    const filesInAdmin = await listFiles({ folderId: "folder_admin" });
    expect(filesInAdmin.some((f) => f.id === "file_008")).toBe(true);
  });

  it("moveFileToFolder(null) moves file to root", async () => {
    await moveFileToFolder("file_001", null);
    const root = await listFiles({ folderId: null });
    expect(root.some((f) => f.id === "file_001")).toBe(true);
  });

  it("deleteFolder moves its files to root", async () => {
    await deleteFolder("folder_labs");
    const folders = await listFolders();
    expect(folders.some((f) => f.id === "folder_labs")).toBe(false);
    const rootFiles = await listFiles({ folderId: null });
    // file_011, file_012, file_007 were in folder_labs originally
    expect(rootFiles.some((f) => f.id === "file_011")).toBe(true);
  });
});
