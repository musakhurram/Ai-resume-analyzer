import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import VerifyEmail from "./features/auth/pages/VerifyEmail";
import Protected from "./features/auth/components/Protected";
import AppShell from "./components/layout/AppShell";
import NewReview from "./features/interview/pages/NewReview";
import Reports from "./features/interview/pages/Reports";
import ReportDetail from "./features/interview/pages/ReportDetail";
import AtsAnalyzer from "./features/ats/pages/AtsAnalyzer";
import AtsReportDetail from "./features/ats/pages/AtsReportDetail";
import Pricing from "./features/billing/pages/Pricing";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { element: <Protected><AppShell /></Protected>, children: [
    { path: "/", element: <Navigate to="/analyze/ats-score" replace /> },
    { path: "/new", element: <NewReview /> }, { path: "/app", element: <NewReview /> }, { path: "/review", element: <NewReview /> },
    { path: "/analyze/ats-score", element: <AtsAnalyzer /> }, { path: "/ats-score", element: <AtsAnalyzer /> }, { path: "/ats", element: <AtsAnalyzer /> },
    { path: "/reports", element: <Reports /> }, { path: "/reports/:id", element: <ReportDetail /> }, { path: "/ats/reports", element: <Navigate to="/reports" replace /> }, { path: "/ats/reports/:id", element: <AtsReportDetail /> }, { path: "/pricing", element: <Pricing /> },
  ]},
  { path: "*", element: <Navigate to="/" replace /> },
]);
