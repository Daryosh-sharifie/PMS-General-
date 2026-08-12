import { Navigate } from "react-router-dom";
import useStore from "../store/useStore.jsx";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

