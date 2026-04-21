import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "@/components/layout/AuthGuard";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ViewerPage from "@/features/viewer/ViewerPage";
import SharePage from "@/features/share/SharePage";
import ImpactPage from "@/features/impact/ImpactPage";
import NotFoundPage from "@/features/misc/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/s/:shareId", element: <SharePage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/file/:id", element: <ViewerPage /> },
          { path: "/impact", element: <ImpactPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
