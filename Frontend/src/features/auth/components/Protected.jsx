import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import PageLoader from "../../../shared/components/PageLoader";

const Protected = ({ children }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return <PageLoader label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default Protected;
