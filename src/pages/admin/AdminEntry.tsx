import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2 } from 'lucide-react';
import AdminLogin from './Login';

export default function AdminEntry() {
  const { isAuthenticated, isLoading } = useAdmin();
  const navigate = useNavigate();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  return <AdminLogin />;
}
