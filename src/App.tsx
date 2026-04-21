import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/sonner";
import UploadDialog from "@/components/shared/UploadDialog";
import ShareDialog from "@/components/shared/ShareDialog";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UploadDialog />
      <ShareDialog />
      <Toaster />
    </>
  );
}

export default App;
