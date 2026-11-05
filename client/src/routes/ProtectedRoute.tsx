import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/Loader';

/** Renders nested routes only for authenticated users. */
export default function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
