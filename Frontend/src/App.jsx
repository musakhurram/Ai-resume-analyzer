import { RouterProvider } from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics />
    </AuthProvider>
  );
}

export default App;
