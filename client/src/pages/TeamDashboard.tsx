import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { User, LogOut, Clock, Shield, Mail, MapPin } from 'lucide-react';

export default function TeamDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [teamMember, setTeamMember] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkTeamAuth();
  }, []);

  const checkTeamAuth = () => {
    try {
      const teamAuth = localStorage.getItem('teamAuth');
      if (teamAuth) {
        const authData = JSON.parse(teamAuth);
        
        // Check if authentication is still valid (24 hours)
        const isValid = authData.isAuthenticated && 
                        authData.loginTime && 
                        (Date.now() - authData.loginTime) < 24 * 60 * 60 * 1000;

        if (isValid) {
          setTeamMember(authData.teamMember);
          setUser(authData.user);
        } else {
          localStorage.removeItem('teamAuth');
          setLocation('/team/login');
        }
      } else {
        setLocation('/team/login');
      }
    } catch (error) {
      console.error('Error checking team auth:', error);
      localStorage.removeItem('teamAuth');
      setLocation('/team/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teamAuth');
    toast({
      title: "👋 Logout effettuato",
      description: "Sei stato disconnesso dal sistema.",
      className: "bg-blue-50 text-blue-900 border-blue-200"
    });
    setLocation('/team/login');
  };

  if (!teamMember || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      editor: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const formatRole = (role: string) => {
    const roleNames = {
      admin: 'Amministratore',
      manager: 'Manager',
      editor: 'Editor',
      viewer: 'Visualizzatore'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="https://i.postimg.cc/1zXFwhRF/download.png" 
                alt="Celio Logo" 
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Team Dashboard
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Benvenuto, {teamMember.firstName}! 👋
          </h2>
          <p className="text-gray-600">
            Hai effettuato l'accesso con successo al sistema ERP Celio.
          </p>
        </div>

        {/* Profile Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                  {teamMember.firstName?.charAt(0)}{teamMember.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {teamMember.firstName} {teamMember.lastName}
                  </h3>
                  <p className="text-gray-600">{teamMember.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(teamMember.role)}`}>
                {formatRole(teamMember.role)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2" />
                <span>Username: {user.username}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 mr-2" />
                <span>{teamMember.email}</span>
              </div>
              {teamMember.department && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{teamMember.department}</span>
                </div>
              )}
              {teamMember.position && (
                <div className="flex items-center text-gray-600">
                  <Shield className="h-5 w-5 mr-2" />
                  <span>{teamMember.position}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Account Attivo
              </h4>
              <p className="text-sm text-gray-600">
                Il tuo account è stato attivato con successo. Benvenuto nel team!
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Accesso completato con successo!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Hai effettuato l'accesso per la prima volta al sistema ERP Celio. 
                  Il tuo account è ora attivo e puoi accedere alle funzionalità assegnate al tuo ruolo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ERP Access Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Accesso Sistema ERP
          </h3>
          <p className="text-gray-600 mb-6">
            Il tuo account è attivo! Accedi al sistema ERP per gestire le funzionalità 
            assegnate al tuo ruolo di {formatRole(teamMember.role)}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                // Store team auth in localStorage for admin access
                localStorage.setItem('teamERP', JSON.stringify({
                  isAuthenticated: true,
                  teamMember: teamMember,
                  user: user,
                  loginTime: Date.now()
                }));
                // Redirect to admin dashboard
                window.location.href = '/admin';
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
              data-testid="button-erp-access"
            >
              🚀 Accedi al Sistema ERP
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="px-6 py-3"
              data-testid="button-home"
            >
              Torna alla homepage
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}