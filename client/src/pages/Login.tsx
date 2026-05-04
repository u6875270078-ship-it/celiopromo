import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';

export default function Login() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // For demo purposes, we'll simulate login by finding customer by email
      const response = await fetch(`/api/customers?email=${encodeURIComponent(formData.email)}`);
      
      if (!response.ok) {
        throw new Error('Customer not found');
      }
      
      const customers = await response.json();
      const customer = customers.find((c: any) => c.email === formData.email);
      
      if (!customer) {
        throw new Error('Email not found');
      }

      // Store user session
      localStorage.setItem('user', JSON.stringify(customer));
      
      // Redirect to profile
      navigate('/profile');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Email non trovata. Verifica il tuo indirizzo email o crea un account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Accedi</h1>
          <p className="text-gray-600 text-lg">
            Accedi al tuo account e segui i tuoi ordini
          </p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Indirizzo email</label>
              <input
                type="email"
                placeholder="tuo@email.it"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                data-testid="input-password"
              />
            </div>
            
            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium"
                data-testid="button-login"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Non hai ancora un account?
            </p>
            <button
              onClick={() => navigate('/register')}
              className="text-sm text-black underline hover:no-underline"
              data-testid="link-register"
            >
              Crea un account
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 underline hover:no-underline"
            data-testid="button-back-home"
          >
            Torna alla home
          </button>
        </div>
      </main>
      <CelioFooter />
    </div>
  );
}