import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/Loader';

/** Login / Register stay out of reach once you're signed in. */
export default function PublicRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <FullPageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
