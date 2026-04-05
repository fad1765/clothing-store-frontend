import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>載入中...</p>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}