import { Navigate } from "react-router-dom";
import useStore from "../store/useStore.jsx";

export default function RoleRoute({ children, allowedRoles = [] }) {
  const user = useStore((s) => s.currentUser);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || (allowedRoles.length && !allowedRoles.includes((user.role || '').toLowerCase()))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

