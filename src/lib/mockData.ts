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

export const mockFiles: ArchivedFile[] = [];

export const mockFolders: Folder[] = [];

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
