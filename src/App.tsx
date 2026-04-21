import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "@/components/ui/sonner";
import UploadDialog from "@/components/shared/UploadDialog";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UploadDialog />
      <Toaster />
    </>
  );
}

export default App;
