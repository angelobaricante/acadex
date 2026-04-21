import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/sonner";
import UploadDialog from "@/components/shared/UploadDialog";
import ShareDialog from "@/components/shared/ShareDialog";
import NewFolderDialog from "@/components/shared/NewFolderDialog";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UploadDialog />
      <ShareDialog />
      <NewFolderDialog />
      <Toaster />
    </>
  );
}

export default App;
