import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import AppShell from "./components/layout/AppShell";
import NewReview from "./features/interview/pages/NewReview";
import Reports from "./features/interview/pages/Reports";
import ReportDetail from "./features/interview/pages/ReportDetail";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: (
      <Protected>
        <AppShell />
      </Protected>
    ),
    children: [
      { path: "/", element: <NewReview /> },
      { path: "/new", element: <NewReview /> },
      { path: "/app", element: <NewReview /> },
      { path: "/review", element: <NewReview /> },
      { path: "/reports", element: <Reports /> },
      { path: "/reports/:id", element: <ReportDetail /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

