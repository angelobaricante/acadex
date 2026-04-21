import { create } from "zustand";
import type { User } from "./types";

interface SessionState {
  user: User | null;
  setUser: (u: User | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

interface UIState {
  uploadDialogOpen: boolean;
  shareDialog: { open: boolean; fileId?: string };
  uploadsVersion: number;
  newFolderDialogOpen: boolean;
  foldersVersion: number;
  openUpload: () => void;
  closeUpload: () => void;
  openShare: (fileId: string) => void;
  closeShare: () => void;
  bumpUploadsVersion: () => void;
  openNewFolder: () => void;
  closeNewFolder: () => void;
  bumpFoldersVersion: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  uploadDialogOpen: false,
  shareDialog: { open: false },
  uploadsVersion: 0,
  newFolderDialogOpen: false,
  foldersVersion: 0,
  openUpload: () => set({ uploadDialogOpen: true }),
  closeUpload: () => set({ uploadDialogOpen: false }),
  openShare: (fileId) => set({ shareDialog: { open: true, fileId } }),
  closeShare: () => set({ shareDialog: { open: false } }),
  bumpUploadsVersion: () => set((s) => ({ uploadsVersion: s.uploadsVersion + 1 })),
  openNewFolder: () => set({ newFolderDialogOpen: true }),
  closeNewFolder: () => set({ newFolderDialogOpen: false }),
  bumpFoldersVersion: () => set((s) => ({ foldersVersion: s.foldersVersion + 1 })),
}));
