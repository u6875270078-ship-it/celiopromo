import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import CustomerSupport from '@/components/CustomerSupport';
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

interface Cart {
  items: CartItem[];
  total: number;
}

export default function Cart() {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [guestId, setGuestId] = useState<string>('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Get or create guest ID
    let currentGuestId = localStorage.getItem('guestId');
    if (!currentGuestId) {
      currentGuestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestId', currentGuestId);
    }
    setGuestId(currentGuestId);
  }, []);

  // Fetch cart data from API
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart', user?.id, guestId],
    queryFn: async () => {
      if (!user?.id && !guestId) return { items: [], subtotal: '0' };
      const response = await fetch(`/api/cart?userId=${user?.id || ''}&guestId=${guestId}`);
      if (!response.ok) return { items: [], subtotal: '0' };
      return response.json();
    },
    enabled: !!(user?.id || guestId),
  });

  // Process cart data to match expected format
  const cart = cartData ? {
    items: (Array.isArray(cartData.items) ? cartData.items : JSON.parse(cartData.items || '[]')).map((item: any, index: number) => ({
      ...item,
      id: item.id || item.productId || index, // Ensure each item has an ID
    })),
    total: parseFloat(cartData.subtotal || '0')
  } : { items: [], total: 0 };

  // Update item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, newQuantity }: { itemId: number; newQuantity: number }) => {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          quantity: newQuantity,
          userId: user?.id,
          guestId: guestId
        })
      });
      if (!response.ok) throw new Error('Failed to update quantity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          userId: user?.id,
          guestId: guestId
        })
      });
      if (!response.ok) throw new Error('Failed to remove item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          guestId: guestId
        })
      });
      if (!response.ok) throw new Error('Failed to clear cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  });

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, newQuantity });
  };

  const removeItem = (itemId: number) => {
    removeItemMutation.mutate(itemId);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert('Il carrello è vuoto. Aggiungi almeno un prodotto prima di procedere al checkout.');
      return;
    }
    
    setLoading(true);
    // Redirect to checkout page
    setTimeout(() => {
      setLocation('/checkout');
      setLoading(false);
    }, 500);
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}€`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-black transition-colors mr-4"
            data-testid="button-back"
          >
            <ArrowLeft size={20} className="mr-2" />
            Indietro
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Il Mio Carrello</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <p className="text-gray-600">Caricamento carrello...</p>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={64} className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Il tuo carrello è vuoto</h2>
            <p className="text-gray-600 mb-8">
              Scopri la nostra collezione e aggiungi i tuoi articoli preferiti
            </p>
            <button
              onClick={() => setLocation('/catalog')}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              data-testid="button-shop-catalog"
            >
              Scopri i nostri prodotti
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">
                    Articoli ({cart.items.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {cart.items.map((item: CartItem) => (
                    <div key={item.id} className="p-6" data-testid={`cart-item-${item.id}`}>
                      <div className="flex items-start space-x-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart size={32} className="text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.name}
                          </h3>
                          
                          {(item.size || item.color) && (
                            <div className="flex space-x-4 text-sm text-gray-600 mb-3">
                              {item.size && <span>Taglia: {item.size}</span>}
                              {item.color && <span>Colore: {item.color}</span>}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus size={16} />
                              </button>
                              
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                data-testid={`button-remove-${item.id}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 border-t border-gray-100">
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm underline"
                    data-testid="button-clear-cart"
                  >
                    Svuota carrello
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-8">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Riepilogo
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotale</span>
                      <span>{formatPrice(cart.total)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-600">
                      <span>Spedizione</span>
                      <span className="text-green-600">Gratuita</span>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Totale</span>
                        <span data-testid="total-amount">{formatPrice(cart.total)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium mb-4"
                    data-testid="button-checkout"
                  >
                    {loading ? 'Elaborazione...' : 'Completa ordine'}
                  </button>
                  
                  <button
                    onClick={() => setLocation('/catalog')}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    data-testid="button-continue-shopping"
                  >
                    Continua acquisti
                  </button>
                  
                  <div className="mt-6 text-center text-sm text-gray-600">
                    <p>🚚 Spedizione gratuita da 50€</p>
                    <p>🔒 Pagamento 100% sicuro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Customer Support Section */}
      <CustomerSupport />
      
      <CelioFooter />
    </div>
  );
}