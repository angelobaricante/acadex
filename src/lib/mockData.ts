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

export const mockImpact: ImpactStats = {
  totalOriginalBytes: 4_980_000_000,
  totalStoredBytes: 3_580_000_000,
  bytesSaved: 1_400_000_000,
  co2KgAvoided: 0.65,
  pesosSaved: 33,
  fileCount: 186,
  storageSavedMoMPercent: 18,
  co2MoMPercent: 18,
  pesosMoMPercent: 18,
  byKind: {
    pdf: { count: 96, bytesSaved: 812_000_000 },
    docx: { count: 42, bytesSaved: 242_000_000 },
    pptx: { count: 18, bytesSaved: 176_000_000 },
    image: { count: 20, bytesSaved: 78_000_000 },
    video: { count: 5, bytesSaved: 63_000_000 },
    other: { count: 5, bytesSaved: 29_000_000 },
  },
  trend: [
    { date: "2026-03-24", bytesSaved: 15_000_000 },
    { date: "2026-03-25", bytesSaved: 14_000_000 },
    { date: "2026-03-26", bytesSaved: 16_500_000 },
    { date: "2026-03-27", bytesSaved: 18_000_000 },
    { date: "2026-03-28", bytesSaved: 17_200_000 },
    { date: "2026-03-29", bytesSaved: 19_800_000 },
    { date: "2026-03-30", bytesSaved: 21_500_000 },
    { date: "2026-03-31", bytesSaved: 23_000_000 },
    { date: "2026-04-01", bytesSaved: 22_400_000 },
    { date: "2026-04-02", bytesSaved: 24_100_000 },
    { date: "2026-04-03", bytesSaved: 25_000_000 },
    { date: "2026-04-04", bytesSaved: 27_500_000 },
    { date: "2026-04-05", bytesSaved: 29_200_000 },
    { date: "2026-04-06", bytesSaved: 31_000_000 },
    { date: "2026-04-07", bytesSaved: 30_500_000 },
    { date: "2026-04-08", bytesSaved: 33_800_000 },
    { date: "2026-04-09", bytesSaved: 36_200_000 },
    { date: "2026-04-10", bytesSaved: 38_000_000 },
    { date: "2026-04-11", bytesSaved: 39_500_000 },
    { date: "2026-04-12", bytesSaved: 42_800_000 },
    { date: "2026-04-13", bytesSaved: 46_100_000 },
    { date: "2026-04-14", bytesSaved: 49_700_000 },
    { date: "2026-04-15", bytesSaved: 52_500_000 },
    { date: "2026-04-16", bytesSaved: 57_900_000 },
    { date: "2026-04-17", bytesSaved: 61_300_000 },
    { date: "2026-04-18", bytesSaved: 66_800_000 },
    { date: "2026-04-19", bytesSaved: 74_200_000 },
    { date: "2026-04-20", bytesSaved: 82_500_000 },
    { date: "2026-04-21", bytesSaved: 95_000_000 },
    { date: "2026-04-22", bytesSaved: 180_000_000 },
  ],
};
