import { useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';

export default function Register() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Italia',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Le password non corrispondono');
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 6) {
      alert('La password deve essere di almeno 6 caratteri');
      return;
    }
    
    setLoading(true);
    
    try {
      // Register user with authentication system
      const userResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        }),
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(errorText || 'Failed to register user');
      }

      // Also create customer record for CRM
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          notes: formData.notes
        }),
      });

      // Customer creation is successful whether new or existing
      if (!customerResponse.ok && customerResponse.status !== 200) {
        console.warn('Customer record creation failed, but user was created successfully');
      }

      // Store user info and redirect
      const userData = await userResponse.json();
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      }));
      
      alert('Registrazione completata con successo!');
      navigate('/catalog');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registrazione fallita: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Crea un account</h1>
          <p className="text-gray-600 text-lg">
            Unisciti alla nostra comunità e scopri le nostre collezioni esclusive
          </p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Nome *</label>
                <input
                  type="text"
                  placeholder="Marie"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  data-testid="input-firstname"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Nom *</label>
                <input
                  type="text"
                  placeholder="Dubois"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  data-testid="input-lastname"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Adresse email *</label>
              <input
                type="email"
                placeholder="marie.dubois@email.fr"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                data-testid="input-email"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 caratteri"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Conferma Password *</label>
                <input
                  type="password"
                  placeholder="Ripeti la password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Téléphone</label>
              <input
                type="tel"
                placeholder="+33 1 23 45 67 89"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                data-testid="input-phone"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Société (optionnel)</label>
              <input
                type="text"
                placeholder="Nom de votre entreprise"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                data-testid="input-company"
              />
            </div>
            
            {/* Address Section */}
            <div className="space-y-6 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium text-gray-900">Indirizzo</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Indirizzo *</label>
                <input
                  type="text"
                  placeholder="Via Roma 123"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  data-testid="input-address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Città *</label>
                  <input
                    type="text"
                    placeholder="Milano"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Codice Postale *</label>
                  <input
                    type="text"
                    placeholder="20100"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                    data-testid="input-postalcode"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Paese *</label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                  data-testid="select-country"
                >
                  <option value="Italia">Italia</option>
                  <option value="Francia">Francia</option>
                  <option value="Spagna">Spagna</option>
                  <option value="Germania">Germania</option>
                  <option value="Svizzera">Svizzera</option>
                  <option value="Austria">Austria</option>
                  <option value="Belgio">Belgio</option>
                  <option value="Paesi Bassi">Paesi Bassi</option>
                  <option value="Altri">Altri</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Informazioni aggiuntive (opzionale)</label>
              <textarea
                placeholder="Le tue preferenze, taglie abituali, ecc..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors resize-none"
                data-testid="input-notes"
              />
            </div>
            
            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium"
                data-testid="button-register"
              >
                {loading ? 'Creazione in corso...' : 'Crea il mio account'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                data-testid="button-back-home"
              >
                Torna alla home
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Creando un account, accetti i nostri{' '}
            <a href="#" className="underline hover:text-gray-900">termini e condizioni</a>
            {' '}e la nostra{' '}
            <a href="#" className="underline hover:text-gray-900">politica sulla privacy</a>.
          </p>
        </div>
      </main>
      <CelioFooter />
    </div>
  );
}