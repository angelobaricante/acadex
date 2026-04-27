import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/sonner";
import UploadDialog from "@/components/shared/UploadDialog";
import ShareDialog from "@/components/shared/ShareDialog";
import NewFolderDialog from "@/components/shared/NewFolderDialog";
import FolderUploadDialog from "@/components/shared/FolderUploadDialog";
import BrandSpinner from "@/components/shared/BrandSpinner";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/googleAuth";
import { getCurrentUser } from "@/lib/api";
import { useSessionStore } from "@/lib/store";

function App() {
  const [isReady, setIsReady] = useState(false);
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    void (async () => {
      try {
        // Attempt to restore token from storage (may throw if not signed in)
        getAccessToken();
        const user = await getCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  if (!isReady) return <div className="grid place-items-center h-screen"><BrandSpinner size={48} /></div>;

  return (
    <>
      <RouterProvider router={router} />
      <UploadDialog />
      <ShareDialog />
      <NewFolderDialog />
      <FolderUploadDialog />
      <Toaster />
    </>
  );
}

export default App;
