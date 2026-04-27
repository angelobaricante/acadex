// src/lib/tagging/autoTag.ts
// Rules-based auto-tagger. No external API needed.

// ---------------------------------------------------------------------------
// Tag taxonomy — these are the only tags the tagger will produce.
// Keep this list in sync with what your UI displays/filters by.
// ---------------------------------------------------------------------------
const DOCUMENT_TYPE_KEYWORDS: Record<string, string[]> = {
    Exam: ["exam", "quiz", "midterm", "finals", "test", "assessment"],
    Lab: ["lab", "laboratory", "experiment", "practical"],
    Thesis: ["thesis", "dissertation", "capstone", "research paper"],
    Project: ["project", "proj", "case study"],
    Textbook: ["textbook", "book", "module", "reading", "reference"],
    Syllabus: ["syllabus", "course outline", "curriculum"],
    Lecture: ["lecture", "notes", "handout", "slides", "lesson"],
    Assignment: ["assignment", "homework", "hw", "activity", "worksheet"],
    Report: ["report", "summary", "review"],
};

// Matches course codes like CS101, ENG201, MATH10, IT123, etc.
const COURSE_CODE_REGEX = /\b([A-Z]{2,6})\s?(\d{2,4}[A-Z]?)\b/g;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

function sanitizeTags(tags: string[]): string[] {
    const seen = new Set<string>();
    return tags
        .map(normalizeTag)
        .filter((tag) => {
            if (!tag || seen.has(tag)) return false;
            seen.add(tag);
            return true;
        })
        .slice(0, 10); // max 10 tags per file
}

// ---------------------------------------------------------------------------
// Tag generators
// ---------------------------------------------------------------------------

/** Extract course codes from the filename or folder name. e.g. "CS101", "MATH10" */
function extractCourseTags(text: string): string[] {
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    COURSE_CODE_REGEX.lastIndex = 0;
    while ((match = COURSE_CODE_REGEX.exec(text.toUpperCase())) !== null) {
        matches.push(match[0].replace(/\s/, ""));
    }
    return matches;
}

/** Detect document type from filename keywords. e.g. "exam", "lab", "thesis" */
function extractDocumentTypeTags(filename: string): string[] {
    const lower = filename.toLowerCase();
    const matched: string[] = [];
    for (const [tag, keywords] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) {
            matched.push(tag);
        }
    }
    return matched;
}

/** Derive a file-type tag from mimeType. e.g. "pdf", "image", "video" */
function extractMimeTag(mimeType: string): string | null {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (
        mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mimeType === "application/vnd.ms-powerpoint"
    ) return "slides";
    if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword"
    ) return "document";
    return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AutoTagInput {
    fileName: string;
    mimeType: string;
    folderName?: string | null; // pass the Supabase folder name if available
}

/**
 * Generate tags for a file based on its name, mime type, and folder name.
 * Returns a sanitized, deduplicated list of tags (max 10).
 *
 * Example output for "CS101_Midterm_Exam.pdf" in folder "CS101":
 *   ["cs101", "exam", "pdf"]
 */
export function generateTags(input: AutoTagInput): string[] {
    const { fileName, mimeType, folderName } = input;

    const raw: string[] = [];

    // 1. Course codes from folder name (highest confidence source)
    if (folderName) {
        raw.push(...extractCourseTags(folderName));
    }

    // 2. Course codes from filename (in case folder name doesn't have one)
    raw.push(...extractCourseTags(fileName));

    // 3. Document type from filename keywords
    raw.push(...extractDocumentTypeTags(fileName));

    // 4. File type from mime type
    const mimeTag = extractMimeTag(mimeType);
    if (mimeTag) raw.push(mimeTag);

    return sanitizeTags(raw);
}
