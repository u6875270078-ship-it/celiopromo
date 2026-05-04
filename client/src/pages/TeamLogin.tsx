import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, User, ArrowRight, Home } from 'lucide-react';

export default function TeamLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/team/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store team member session
        localStorage.setItem('teamAuth', JSON.stringify({
          isAuthenticated: true,
          username: credentials.username,
          user: data.user,
          teamMember: data.teamMember,
          loginTime: Date.now(),
          token: data.token
        }));
        
        toast({
          title: "✅ Accesso riuscito!",
          description: `Benvenuto ${data.teamMember?.firstName || credentials.username}!`,
          className: "bg-green-50 text-green-900 border-green-200"
        });
        
        setLocation('/team/dashboard');
      } else {
        toast({
          title: "❌ Errore di accesso",
          description: data.message || "Nome utente o password non corretti",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Errore di connessione",
        description: "Impossibile connettersi al server. Riprova più tardi.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <img 
              src="https://i.postimg.cc/1zXFwhRF/download.png" 
              alt="Celio Logo" 
              className="h-12 w-12 object-contain filter invert"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Team Celio
          </h1>
          <p className="text-gray-600">
            Accedi al sistema ERP con le tue credenziali
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome utente
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Inserisci il tuo username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="input-username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Inserisci la tua password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-medium"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Accesso in corso...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Accedi al Sistema ERP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-3">
              🔐 Usa le credenziali ricevute via email
            </p>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="text-sm"
              data-testid="button-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Torna alla homepage
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Celio. Sistema ERP Team Management
          </p>
        </div>
      </div>
    </div>
  );
}