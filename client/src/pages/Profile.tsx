import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import CustomerSupport from '@/components/CustomerSupport';
import { User, Package, ShoppingCart, LogOut, Clock, MapPin } from 'lucide-react';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  customerId?: number;
  customerEmail: string;
  customerName: string;
  items: string; // JSON string
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  total: string;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  shippingAddress: string; // JSON string
  billingAddress?: string; // JSON string
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export default function Profile() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<Customer | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    // Simulate cart count (would come from cart API in real app)
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartCount(cart.items?.length || 0);
    }
  }, [navigate]);

  // Fetch user's orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch customer data
  const { data: customer } = useQuery<Customer>({
    queryKey: ['/api/customers', user?.email],
    queryFn: async () => {
      const response = await fetch(`/api/customers/email/${user?.email}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      return response.json();
    },
    enabled: !!user?.email,
  });

  // Fetch user's addresses
  const { data: addresses = [] } = useQuery({
    queryKey: ['/api/addresses', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/addresses/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch addresses');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800', 
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
      pending: 'In attesa',
      processing: 'In elaborazione',
      shipped: 'Spedito',
      delivered: 'Consegnato',
      cancelled: 'Annullato'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0,00€' : `${numPrice.toFixed(2)}€`;
  };

  const parseOrderItems = (itemsJson: string): OrderItem[] => {
    try {
      return typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson || [];
    } catch {
      return [];
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Cart Notification */}
        {cartCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="text-blue-600" size={20} />
                <div>
                  <p className="font-medium text-blue-900">
                    Hai {cartCount} articol{cartCount > 1 ? 'i' : 'o'} in attesa nel carrello
                  </p>
                  <p className="text-sm text-blue-700">
                    Completa l'ordine prima che non siano più disponibili
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/cart')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                data-testid="button-view-cart"
              >
                Vedi carrello
              </button>
            </div>
          </div>
        )}

        {/* User Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer?.firstName || user.firstName} {customer?.lastName || user.lastName}
                </h1>
                <p className="text-gray-600">{customer?.email || user.email}</p>
                {(customer?.company || user.company) && (
                  <p className="text-sm text-gray-500">{customer?.company || user.company}</p>
                )}
                {customer?.phone && (
                  <p className="text-sm text-gray-500">📞 {customer.phone}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              data-testid="button-logout"
            >
              <LogOut size={18} />
              <span>Esci</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <Package size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-600">Ordini</p>
            </div>
            <div className="p-4">
              <ShoppingCart size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold text-gray-900">{cartCount}</p>
              <p className="text-sm text-gray-600">Articoli nel carrello</p>
            </div>
            <div className="p-4">
              <Clock size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}
              </p>
              <p className="text-sm text-gray-600">In corso</p>
            </div>
            <div className="p-4 cursor-pointer" onClick={() => navigate('/addresses')}>
              <MapPin size={24} className="mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900">+</p>
              <p className="text-sm text-blue-600">Gestisci indirizzi</p>
            </div>
          </div>
        </div>

        {/* Address Information */}
{customer && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Indirizzo di spedizione</h2>
              <button
                onClick={() => navigate('/addresses')}
                className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                data-testid="button-manage-addresses"
              >
                Gestisci indirizzi
              </button>
            </div>
            
            {addresses.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-gray-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {addresses[0].firstName} {addresses[0].lastName}
                    </p>
                    <p className="text-gray-700">{addresses[0].line1}</p>
                    {addresses[0].line2 && (
                      <p className="text-gray-700">{addresses[0].line2}</p>
                    )}
                    <p className="text-gray-700">
                      {addresses[0].city} {addresses[0].postalCode}
                    </p>
                    <p className="text-gray-700">{addresses[0].country}</p>
                    {addresses[0].phone && (
                      <p className="text-gray-600 text-sm mt-2">Tel: {addresses[0].phone}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun indirizzo salvato</h3>
                <p className="text-gray-600 mb-6">
                  Aggiungi il tuo indirizzo per velocizzare i tuoi acquisti
                </p>
                <button
                  onClick={() => navigate('/addresses')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="button-add-address"
                >
                  Aggiungi indirizzo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Order History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Cronologia ordini</h2>
          
          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Caricamento ordini...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6" data-testid={`order-${order.id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Commande #{order.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="font-bold text-lg mt-2">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Articoli ordinati:</h4>
                    <div className="space-y-2">
                      {parseOrderItems(order.items).map((item: OrderItem, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.name} (x{item.quantity})
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun ordine</h3>
              <p className="text-gray-600 mb-6">
                Non hai ancora effettuato nessun ordine.
              </p>
              <button
                onClick={() => navigate('/catalog')}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid="button-shop-now"
              >
                Scopri i nostri prodotti
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Customer Support Section */}
      <CustomerSupport />
      
      <CelioFooter />
    </div>
  );
}