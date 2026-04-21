import type {
  ArchivedFile,
  Folder,
  ImpactStats,
  ShareLink,
  User,
} from "./types";

export const mockUsers: Record<string, User> = {
  student_maria: {
    id: "student_maria",
    name: "Maria Santos",
    email: "maria.santos@students.bsu.edu.ph",
    role: "student",
  },
  faculty_cruz: {
    id: "faculty_cruz",
    name: "Prof. Juan Cruz",
    email: "juan.cruz@bsu.edu.ph",
    role: "faculty",
  },
  admin_reyes: {
    id: "admin_reyes",
    name: "Ana Reyes",
    email: "ana.reyes@bsu.edu.ph",
    role: "admin",
  },
};

function f(
  id: string,
  name: string,
  kind: ArchivedFile["kind"],
  mimeType: string,
  ownerId: string,
  originalBytes: number,
  storedBytes: number,
  tags: string[],
  createdAt: string,
  previewFile?: string
): ArchivedFile {
  const url = previewFile ? `/mock-previews/${previewFile}` : "";
  return {
    id,
    name,
    kind,
    mimeType,
    ownerId,
    originalBytes,
    storedBytes,
    compressionRatio: (originalBytes - storedBytes) / originalBytes,
    tags,
    createdAt,
    updatedAt: createdAt,
    previewUrl: url,
    downloadUrl: url,
  };
}

export const mockFiles: ArchivedFile[] = [
  f("file_001", "CS101 Lecture 01 - Intro.pdf", "pdf", "application/pdf", "faculty_cruz", 47_185_920, 8_912_896, ["CS101", "Lecture", "Week 1"], "2026-04-02T09:00:00Z", "sample.pdf"),
  f("file_002", "CS101 Lecture 02 - Variables.pdf", "pdf", "application/pdf", "faculty_cruz", 52_428_800, 9_437_184, ["CS101", "Lecture", "Week 2"], "2026-04-09T09:00:00Z", "sample.pdf"),
  f("file_003", "CS101 Lecture 03 - Loops.pdf", "pdf", "application/pdf", "faculty_cruz", 41_943_040, 7_340_032, ["CS101", "Lecture", "Week 3"], "2026-04-16T09:00:00Z", "sample.pdf"),
  f("file_004", "Thesis_Draft_v3.docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "student_maria", 18_874_368, 3_145_728, ["Thesis", "Draft"], "2026-04-10T14:12:00Z"),
  f("file_005", "Midterm_Slides.pptx", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "faculty_cruz", 88_080_384, 15_728_640, ["CS101", "Midterm", "Slides"], "2026-04-14T10:30:00Z"),
  f("file_006", "Campus_Photo.jpg", "image", "image/jpeg", "admin_reyes", 6_291_456, 1_048_576, ["Campus", "Photo"], "2026-03-22T08:00:00Z", "lecture.jpg"),
  f("file_007", "Lab_Session_Recording.mp4", "video", "video/mp4", "faculty_cruz", 524_288_000, 104_857_600, ["CS101", "Lab", "Recording"], "2026-04-11T15:00:00Z", "clip.mp4"),
  f("file_008", "Student_List_2026.docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "admin_reyes", 2_097_152, 262_144, ["Admin", "2026"], "2026-03-15T11:00:00Z"),
  f("file_009", "Research_Paper_Figures.jpg", "image", "image/jpeg", "student_maria", 12_582_912, 2_097_152, ["Research", "Figures"], "2026-04-05T17:00:00Z", "lecture.jpg"),
  f("file_010", "Finals_Schedule.pdf", "pdf", "application/pdf", "admin_reyes", 3_145_728, 524_288, ["Admin", "Finals"], "2026-04-18T12:00:00Z", "sample.pdf"),
  f("file_011", "CS101 Lab 01 Handout.pdf", "pdf", "application/pdf", "faculty_cruz", 9_437_184, 1_572_864, ["CS101", "Lab", "Handout"], "2026-04-03T09:00:00Z", "sample.pdf"),
  f("file_012", "CS101 Lab 02 Handout.pdf", "pdf", "application/pdf", "faculty_cruz", 10_485_760, 1_835_008, ["CS101", "Lab", "Handout"], "2026-04-10T09:00:00Z", "sample.pdf"),
  f("file_013", "Thesis_References.pdf", "pdf", "application/pdf", "student_maria", 5_242_880, 943_718, ["Thesis", "References"], "2026-04-12T18:00:00Z", "sample.pdf"),
  f("file_014", "Orientation_Slides.pptx", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "admin_reyes", 31_457_280, 5_242_880, ["Admin", "Orientation"], "2026-03-01T09:00:00Z"),
  f("file_015", "Project_Demo_Clip.mp4", "video", "video/mp4", "student_maria", 104_857_600, 20_971_520, ["Project", "Demo"], "2026-04-19T20:00:00Z", "clip.mp4"),
  f("file_016", "Textbook_Ch3.pdf", "pdf", "application/pdf", "faculty_cruz", 78_643_200, 13_631_488, ["Textbook", "Chapter"], "2026-02-15T09:00:00Z", "sample.pdf"),
  f("file_017", "Syllabus_CS101.docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "faculty_cruz", 1_048_576, 131_072, ["CS101", "Syllabus"], "2026-01-20T08:00:00Z"),
  f("file_018", "Field_Trip_Photo.jpg", "image", "image/jpeg", "student_maria", 8_388_608, 1_310_720, ["Photo", "Field Trip"], "2026-03-30T14:00:00Z", "lecture.jpg"),
  f("file_019", "Exam_Review.pdf", "pdf", "application/pdf", "faculty_cruz", 22_020_096, 3_670_016, ["CS101", "Exam", "Review"], "2026-04-17T11:00:00Z", "sample.pdf"),
  f("file_020", "Announcement.pdf", "pdf", "application/pdf", "admin_reyes", 524_288, 65_536, ["Admin", "Announcement"], "2026-04-20T08:00:00Z", "sample.pdf"),
];

export const mockFolders: Folder[] = [
  { id: "folder_cs101", name: "CS101 Lectures", ownerId: "faculty_cruz", color: "green", createdAt: "2026-04-01T08:00:00Z" },
  { id: "folder_labs", name: "CS101 Labs", ownerId: "faculty_cruz", color: "amber", createdAt: "2026-04-01T08:00:00Z" },
  { id: "folder_thesis", name: "Thesis", ownerId: "student_maria", color: "violet", createdAt: "2026-04-01T08:00:00Z" },
  { id: "folder_admin", name: "Admin Announcements", ownerId: "admin_reyes", color: "blue", createdAt: "2026-03-15T08:00:00Z" },
];

const folderAssignments: Record<string, string> = {
  file_001: "folder_cs101",
  file_002: "folder_cs101",
  file_003: "folder_cs101",
  file_016: "folder_cs101",
  file_019: "folder_cs101",
  file_011: "folder_labs",
  file_012: "folder_labs",
  file_007: "folder_labs",
  file_004: "folder_thesis",
  file_013: "folder_thesis",
  file_010: "folder_admin",
  file_020: "folder_admin",
};

for (const file of mockFiles) {
  file.folderId = folderAssignments[file.id] ?? null;
}

export const mockShareLinks: ShareLink[] = [
  {
    id: "share_abc123",
    fileId: "file_001",
    createdBy: "faculty_cruz",
    createdAt: "2026-04-02T09:05:00Z",
    permission: "view",
  },
  {
    id: "share_def456",
    fileId: "file_005",
    createdBy: "faculty_cruz",
    createdAt: "2026-04-14T10:35:00Z",
    permission: "view_and_download",
  },
];

function computeImpact(files: ArchivedFile[]): ImpactStats {
  const byKind: ImpactStats["byKind"] = {
    pdf: { count: 0, bytesSaved: 0 },
    docx: { count: 0, bytesSaved: 0 },
    pptx: { count: 0, bytesSaved: 0 },
    image: { count: 0, bytesSaved: 0 },
    video: { count: 0, bytesSaved: 0 },
    other: { count: 0, bytesSaved: 0 },
  };
  let totalOriginal = 0;
  let totalStored = 0;
  for (const file of files) {
    totalOriginal += file.originalBytes;
    totalStored += file.storedBytes;
    const slot = byKind[file.kind];
    slot.count += 1;
    slot.bytesSaved += file.originalBytes - file.storedBytes;
  }
  const bytesSaved = totalOriginal - totalStored;

  const trend: ImpactStats["trend"] = [];
  const start = new Date("2026-03-22T00:00:00Z").getTime();
  const dayMs = 86_400_000;
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(start + i * dayMs).toISOString().slice(0, 10);
    trend.push({
      date,
      bytesSaved: Math.round((bytesSaved / 30) * (0.7 + Math.random() * 0.6)),
    });
  }

  return {
    totalOriginalBytes: totalOriginal,
    totalStoredBytes: totalStored,
    bytesSaved,
    co2KgAvoided: Math.round((bytesSaved / 1_073_741_824) * 0.5 * 100) / 100,
    pesosSaved: Math.round((bytesSaved / 1_073_741_824) * 23),
    fileCount: files.length,
    byKind,
    trend,
  };
}

export const mockImpact: ImpactStats = computeImpact(mockFiles);
