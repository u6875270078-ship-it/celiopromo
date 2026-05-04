import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, MapPin, Star, ArrowLeft, Truck, CreditCard } from 'lucide-react';

interface Address {
  id: number;
  userId?: number;
  customerId?: number;
  label?: string;
  type: 'shipping' | 'billing' | 'both';
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export default function AddressManager() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    type: 'both' as 'shipping' | 'billing' | 'both',
    firstName: '',
    lastName: '',
    company: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Italia',
    phone: '',
    isDefault: false,
    isDefaultShipping: false,
    isDefaultBilling: false
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Pre-fill form with user data when creating new address
    if (parsedUser && !editingAddress) {
      setFormData(prev => ({
        ...prev,
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        phone: parsedUser.phone || ''
      }));
    }
  }, [navigate, editingAddress]);

  // Fetch user addresses
  const { data: addresses = [], isLoading, refetch } = useQuery<Address[]>({
    queryKey: ['/api/addresses', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/addresses/${user!.id}`);
      if (!response.ok) throw new Error('Failed to fetch addresses');
      return response.json();
    }
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      return apiRequest('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({
          ...addressData,
          userId: user!.id,
          customerId: user!.id // Link to customer record
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
      setShowForm(false);
      resetForm();
    }
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
      setShowForm(false);
      setEditingAddress(null);
      resetForm();
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/addresses/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
    }
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/addresses/${id}/default`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: user!.id })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
    }
  });

  const resetForm = () => {
    setFormData({
      label: '',
      type: 'both',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      company: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Italia',
      phone: user?.phone || '',
      isDefault: false,
      isDefaultShipping: false,
      isDefaultBilling: false
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createAddressMutation.mutate(formData);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || '',
      type: address.type || 'both',
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault,
      isDefaultShipping: address.isDefaultShipping || false,
      isDefaultBilling: address.isDefaultBilling || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo indirizzo?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const validatePostalCode = (code: string, country: string): boolean => {
    if (country === 'IT') {
      return /^[0-9]{5}$/.test(code);
    }
    return code.length >= 3;
  };

  const formatAddress = (address: Address): string => {
    const parts = [
      address.line1,
      address.line2,
      `${address.postalCode} ${address.city}`,
      address.state,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              data-testid="button-back-profile"
            >
              <ArrowLeft size={20} />
              <span>Torna al profilo</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">I miei indirizzi</h1>
              <p className="text-gray-600">Gestisci i tuoi indirizzi di consegna</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingAddress(null);
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            data-testid="button-add-address"
          >
            <Plus size={18} />
            <span>Aggiungi indirizzo</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Caricamento indirizzi...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-6 relative ${
                  address.isDefault ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
                data-testid={`address-${address.id}`}
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Star size={12} className="mr-1" />
                      Predefinito
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin size={18} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                      {address.label || 'Indirizzo'}
                    </h3>
                  </div>
                  <p className="font-medium text-gray-900">
                    {address.firstName} {address.lastName}
                  </p>
                  {address.company && (
                    <p className="text-sm text-gray-600">{address.company}</p>
                  )}
                  <p className="text-gray-700 text-sm">
                    {formatAddress(address)}
                  </p>
                  {address.phone && (
                    <p className="text-gray-600 text-sm">Tel: {address.phone}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    data-testid={`button-edit-${address.id}`}
                  >
                    <Edit2 size={16} />
                    <span>Modifica</span>
                  </button>
                  
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                      data-testid={`button-default-${address.id}`}
                    >
                      <Star size={16} />
                      <span>Predefinito</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                    data-testid={`button-delete-${address.id}`}
                  >
                    <Trash2 size={16} />
                    <span>Elimina</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {addresses.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun indirizzo</h3>
            <p className="text-gray-600 mb-6">
              Aggiungi il tuo primo indirizzo di consegna per semplificare i tuoi ordini.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              data-testid="button-add-first-address"
            >
              Aggiungi il primo indirizzo
            </button>
          </div>
        )}

        {/* Address Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAddress ? 'Modifica indirizzo' : 'Nuovo indirizzo'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  data-testid="button-close-form"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Etichetta (opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="Casa, Ufficio, ecc..."
                    value={formData.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    data-testid="input-label"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      data-testid="input-firstname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      data-testid="input-lastname"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Azienda (opzionale)
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    data-testid="input-company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Indirizzo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Via, Piazza, ecc..."
                    value={formData.line1}
                    onChange={(e) => handleInputChange('line1', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    data-testid="input-line1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Indirizzo 2 (opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="Interno, Scala, Piano, ecc..."
                    value={formData.line2}
                    onChange={(e) => handleInputChange('line2', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    data-testid="input-line2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      CAP *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="00100"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                        formData.postalCode && !validatePostalCode(formData.postalCode, formData.country)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200'
                      }`}
                      data-testid="input-postalcode"
                    />
                    {formData.postalCode && !validatePostalCode(formData.postalCode, formData.country) && (
                      <p className="text-red-600 text-sm mt-1">CAP non valido per l'Italia (5 cifre)</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Città *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      data-testid="input-city"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Provincia (opzionale)
                    </label>
                    <input
                      type="text"
                      placeholder="RM, MI, TO..."
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Paese *
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      data-testid="input-country"
                    >
                      <option value="IT">Italia</option>
                      <option value="FR">Francia</option>
                      <option value="ES">Spagna</option>
                      <option value="DE">Germania</option>
                      <option value="CH">Svizzera</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Telefono (opzionale)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    data-testid="input-phone"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                    className="rounded border-gray-300"
                    data-testid="checkbox-default"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Imposta come indirizzo predefinito
                  </label>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAddress(null);
                      resetForm();
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid="button-cancel"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    data-testid="button-save-address"
                  >
                    {createAddressMutation.isPending || updateAddressMutation.isPending
                      ? 'Salvataggio...'
                      : editingAddress
                      ? 'Salva modifiche'
                      : 'Salva indirizzo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      
      <CelioFooter />
    </div>
  );
}