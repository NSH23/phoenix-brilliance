import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Redirects /admin/login to /admin (login page)
 * This maintains backward compatibility while using the new routing structure
 */
export default function LoginRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to /admin (defaults to login tab)
    navigate('/admin', { replace: true });
  }, [navigate]);

  return null;
}
