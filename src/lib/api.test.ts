import { describe, it, expect, beforeEach } from "vitest";
import { listFiles, getFile, mockSignIn, __resetApiStateForTests } from "./api";

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
