import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    try {
      // Check for admin authentication first
      const adminAuth = localStorage.getItem('adminAuth');
      if (adminAuth) {
        const authData = JSON.parse(adminAuth);
        
        // Check if authentication is still valid (24 hours)
        const isValid = authData.isAuthenticated && 
                        authData.loginTime && 
                        (Date.now() - authData.loginTime) < 24 * 60 * 60 * 1000;

        if (isValid) {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        } else {
          // Clear expired auth
          localStorage.removeItem('adminAuth');
        }
      }

      // Check for team ERP authentication
      const teamERP = localStorage.getItem('teamERP');
      if (teamERP) {
        const teamAuthData = JSON.parse(teamERP);
        
        // Check if team authentication is still valid (24 hours)
        const isTeamValid = teamAuthData.isAuthenticated && 
                           teamAuthData.loginTime && 
                           (Date.now() - teamAuthData.loginTime) < 24 * 60 * 60 * 1000;

        if (isTeamValid && teamAuthData.teamMember) {
          // Store team auth as admin auth for consistency
          localStorage.setItem('adminAuth', JSON.stringify({
            isAuthenticated: true,
            userType: 'team',
            username: teamAuthData.user?.username || 'Team Member',
            teamMember: teamAuthData.teamMember,
            user: teamAuthData.user,
            loginTime: teamAuthData.loginTime,
            role: teamAuthData.teamMember.role
          }));
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        } else {
          // Clear expired team auth
          localStorage.removeItem('teamERP');
        }
      }

      // No valid authentication found
      setLocation('/admin/login');
      
    } catch (error) {
      console.error('Error checking admin auth:', error);
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('teamERP');
      setLocation('/admin/login');
    }
    
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useLocation
  }

  return <>{children}</>;
}