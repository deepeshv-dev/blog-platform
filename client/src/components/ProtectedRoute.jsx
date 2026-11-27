import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="state-box">Preparing your writing desk…</div>;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
