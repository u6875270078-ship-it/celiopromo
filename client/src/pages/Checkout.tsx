import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';
import CustomerSupport from '@/components/CustomerSupport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, CreditCard, Truck, Shield, Check, MapPin } from 'lucide-react';

// Import payment logos
import visaLogo from '@assets/download (7)_1756830418960.png';
import masterCardLogo from '@assets/download (8)_1756830418961.png';

// Initialize Stripe with test keys for development
const stripePromise = loadStripe('pk_test_51QgNreDed5dge8b4lDUDmyZUJkeFOWH18SlQqG6P2ghV8G6G41E4xETjpo3UaERgIxaD7pzJfZ4up2f6paUzdmgF00Lv2T5iR2').catch(error => {
  console.warn('Stripe failed to load:', error);
  return null;
});

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Cart {
  id: number;
  items: CartItem[] | string;
  subtotal: string;
}

// Stripe Payment Form Component  
const StripePaymentForm = ({ clientSecret, total, onSuccess }: { clientSecret: string; total: number; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      console.error('❌ Payment failed:', error);
      toast({
        title: "Errore di pagamento",
        description: error.message || "Pagamento non riuscito",
      });
      setIsLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('✅ Payment successful! Now creating order...');
      
      // NOW create the order after successful payment
      const { customerInfo, items, total: orderTotal } = (window as any).pendingOrderData;
      
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerInfo,
            items,
            total: orderTotal,
            paymentMethod: 'stripe',
            paymentId: paymentIntent.id
          })
        });

        const orderData = await response.json();
        
        if (orderData.success) {
          console.log('✅ Order created successfully after payment!');
          
          // Clear the cart from database after successful order
          try {
            await fetch('/api/cart/clear', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: customerInfo.userId,
                guestId: localStorage.getItem('guestId')
              })
            });
            console.log('🗑️ Cart cleared after successful order');
          } catch (clearError) {
            console.warn('⚠️ Failed to clear cart, but order was successful:', clearError);
          }
          
          queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
          
          toast({
            title: "Ordine completato!",
            description: "Pagamento ricevuto e ordine confermato!",
          });
          
          onSuccess();
        } else {
          throw new Error('Order creation failed after payment');
        }
        
      } catch (orderError) {
        console.error('❌ Order creation failed after successful payment:', orderError);
        toast({
          title: "Errore ordine",
          description: "Pagamento ricevuto ma errore nella creazione dell'ordine. Contatta il supporto.",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-4">Completa il pagamento</h3>
        <PaymentElement />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-black hover:bg-gray-800 text-white py-3"
      >
        {isLoading ? 'Elaborazione...' : `Paga ${total.toFixed(2)}€`}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const [checkoutData, setCheckoutData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Italia',
    paymentMethod: 'stripe'
  });

  const [clientSecret, setClientSecret] = useState("");
  const [paymentStep, setPaymentStep] = useState('auth-choice'); // 'auth-choice' | 'login' | 'guest-details' | 'details' | 'payment' | 'success'
  const [isGuest, setIsGuest] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // If user is already logged in, skip auth choice and go to details
      setPaymentStep('details');
      // Pre-fill form with user data
      setCheckoutData(prev => ({
        ...prev,
        email: parsedUser.email || '',
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        phone: parsedUser.phone || '',
        address: parsedUser.address || '',
        city: parsedUser.city || '',
        postalCode: parsedUser.postalCode || '',
        country: parsedUser.country || 'Italia'
      }));
    }
  }, []);

  // Fetch cart data for both logged-in users and guests
  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      let url = '/api/cart';
      if (user?.id) {
        url += `?userId=${user.id}`;
      } else {
        // For guest users, get or create guest ID
        let guestId = localStorage.getItem('guestId');
        if (!guestId) {
          guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('guestId', guestId);
        }
        url += `?guestId=${guestId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
    // Always enabled since we support both users and guests
    enabled: true,
  });

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Ordine completato!",
        description: `Il tuo ordine #${data.orderNumber} è stato processato con successo`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      setLocation('/orders');
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'elaborazione dell'ordine",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setCheckoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const response = await fetch('/api/customers');
      const customers = await response.json();
      
      // Find customer by email
      const customer = customers.find((c: any) => c.email === loginForm.email);
      
      if (customer) {
        setUser(customer);
        localStorage.setItem('user', JSON.stringify(customer));
        
        // Pre-fill checkout form with customer data
        setCheckoutData(prev => ({
          ...prev,
          email: customer.email || '',
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          postalCode: customer.postalCode || '',
          country: customer.country || 'Italia'
        }));
        
        setPaymentStep('details');
        toast({
          title: "Login effettuato!",
          description: "I tuoi dati sono stati caricati automaticamente.",
        });
      } else {
        toast({
          title: "Errore",
          description: "Email non trovata. Registrati o procedi come ospite.",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Errore",
        description: "Errore durante il login. Riprova.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGuestCheckout = () => {
    setIsGuest(true);
    setPaymentStep('guest-details');
  };

  const handleBackToAuthChoice = () => {
    setPaymentStep('auth-choice');
    setIsGuest(false);
    setLoginForm({ email: '', password: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted! Payment method:', checkoutData.paymentMethod);
    
    if (!cart) {
      toast({
        title: "Errore",
        description: "Carrello vuoto",
      });
      return;
    }

    const items = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items as string || '[]');
    console.log('📦 Cart items:', items);
    
    if (items.length === 0) {
      // For demo purposes, create a test item if cart is empty
      console.log('📝 Cart is empty, creating test item for demo');
      const testItems = [{
        productId: 1,
        name: "Prodotto di test",
        price: 29.99,
        quantity: 1,
        color: "Nero",
        size: "M"
      }];
      
      toast({
        title: "Demo Mode",
        description: "Usando un prodotto di test per dimostrare il pagamento",
      });
      
      // Continue with test item instead of returning
      items.push(...testItems);
    }

    setProcessing(true);
    console.log('✅ Starting payment processing...');

    try {
      const customerInfo = {
        userId: user?.id || null, // Include user ID to link order to profile
        name: `${checkoutData.firstName} ${checkoutData.lastName}`,
        email: checkoutData.email,
        phone: checkoutData.phone,
        shippingAddress: {
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          line1: checkoutData.address,
          city: checkoutData.city,
          postalCode: checkoutData.postalCode,
          country: checkoutData.country,
          phone: checkoutData.phone
        },
        billingAddress: {
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          line1: checkoutData.address,
          city: checkoutData.city,
          postalCode: checkoutData.postalCode,
          country: checkoutData.country,
          phone: checkoutData.phone
        }
      };

      console.log('💳 Processing payment for method:', checkoutData.paymentMethod);
      
      // Calculate the total properly
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const total = subtotal; // No shipping or tax for now
      
      // Handle different payment methods
      if (checkoutData.paymentMethod === 'stripe') {
        // For Stripe, create payment intent and show payment form
        await handleStripePayment(customerInfo, items, total);
      } else {
        // For other payment methods (demo/fallback)
        console.log('🔄 Processing non-Stripe payment...');
        
        try {
          // Create the order using the API
          const orderData = await createOrder(
            customerInfo, 
            items, 
            total, 
            checkoutData.paymentMethod, 
            `${checkoutData.paymentMethod}_${Date.now()}`
          );
          
          console.log('✅ Order created successfully:', orderData);
          
          // Clear the cart from database after successful order
          try {
            await fetch('/api/cart/clear', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.id,
                guestId: localStorage.getItem('guestId')
              })
            });
            console.log('🗑️ Cart cleared after successful order');
          } catch (clearError) {
            console.warn('⚠️ Failed to clear cart, but order was successful:', clearError);
          }
          
          // Clear the cart after successful order creation
          queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
          
          // Show success toast and redirect
          toast({
            title: "Ordine creato!",
            description: "Grazie per il tuo ordine! Sarai reindirizzato al pagamento.",
          });
          
          // Redirect to success page
          setTimeout(() => {
            setLocation('/payment/success');
          }, 1000);
          
        } catch (orderError) {
          console.error('❌ Order creation failed:', orderError);
          throw new Error('Failed to create order');
        }
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      console.error('Checkout error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause
      });
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il pagamento",
      });
    } finally {
      setProcessing(false);
      console.log('✅ Payment processing finished');
    }
  };

  const handleStripePayment = async (customerInfo: any, items: any[], total: number) => {
    try {
      console.log('🔵 Attempting Stripe payment initialization...');
      
      // Check if Stripe is available
      const stripe = await stripePromise;
      if (!stripe) {
        console.error('❌ CRITICAL: Stripe not available - cannot process payments!');
        toast({
          title: "Errore di pagamento",
          description: "Sistema di pagamento non disponibile. Riprova più tardi.",
        });
        throw new Error('Stripe payment system unavailable');
      }

      // CRITICAL FIX: Create payment intent FIRST, before any order creation
      console.log('💳 Creating payment intent before order...');

      // Create payment intent
      const response = await apiRequest('/api/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: total,
          currency: 'eur'
        })
      });

      const { clientSecret } = response;
      console.log('🔑 Payment intent created successfully:', clientSecret.substring(0, 20) + '...');
      
      setClientSecret(clientSecret);
      setPaymentStep('payment');
      
      console.log('🎯 Payment step set to "payment" - customer must complete payment FIRST');
      console.log('Debug values:', { 
        paymentStep: 'payment', 
        paymentMethod: checkoutData.paymentMethod, 
        hasClientSecret: !!clientSecret,
        stripeAvailable: !!stripe
      });
      
      // Store order data for after successful payment
      (window as any).pendingOrderData = { customerInfo, items, total };
      
    } catch (error: any) {
      console.error('🔵 Stripe payment initialization failed:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        response: error?.response?.data || 'No response data'
      });
      
      toast({
        title: "Errore di pagamento",
        description: "Impossibile inizializzare il sistema di pagamento.",
      });
      throw error;
    }
  };


  // Function to save shipping address to user profile
  const saveShippingAddressToProfile = async (shippingAddress: any) => {
    try {
      if (!customer?.id) {
        console.log('No customer ID found, skipping address save');
        return;
      }

      console.log('💾 Saving shipping address to profile...');
      
      const addressData = {
        customerId: customer.id,
        userId: user?.id || null,
        type: 'shipping',
        label: 'Indirizzo di spedizione',
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state || null,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || null,
        isDefaultShipping: true
      };

      const response = await apiRequest('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(addressData)
      });

      if (response.ok) {
        console.log('✅ Shipping address saved to profile successfully');
        // Invalidate customer addresses cache
        queryClient.invalidateQueries({ queryKey: ['/api/customers', customer.id, 'addresses'] });
      } else {
        console.warn('⚠️ Failed to save shipping address to profile');
      }
    } catch (error) {
      console.error('❌ Error saving address to profile:', error);
    }
  };

  const createOrder = async (customerInfo: any, items: any[], total: number, paymentMethod: string, paymentId: string) => {
    try {
      console.log('Creating order with:', { customerInfo, items, total, paymentMethod, paymentId });
      
      const response = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerInfo,
          items,
          total,
          paymentMethod,
          paymentId
        })
      });

      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.status} ${response.statusText}`);
      }

      const orderData = await response.json();
      console.log('Order response:', orderData);
      
      if (orderData.success || orderData.id || orderData.orderId) {
        // Auto-save shipping address to customer profile
        if (user && customerInfo.shippingAddress) {
          await saveShippingAddressToProfile(customerInfo.shippingAddress);
        }
        
        toast({
          title: "Ordine creato!",
          description: orderData.message || "Ordine creato con successo",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        return orderData;
      } else {
        console.error('Order creation failed:', orderData);
        throw new Error(orderData.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('createOrder error details:', error);
      throw error;
    }
  };

  // Fetch customer data if user is logged in to pre-fill address
  const { data: customer } = useQuery({
    queryKey: ['/api/customers', user?.email],
    queryFn: async () => {
      const response = await fetch(`/api/customers/email/${user?.email}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      return response.json();
    },
    enabled: !!user?.email,
  });

  // Fetch saved addresses for the user
  const { data: userAddresses } = useQuery({
    queryKey: ['/api/addresses', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/addresses/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch addresses');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Pre-fill checkout data with customer data and saved address
  useEffect(() => {
    if (customer) {
      // First, fill with basic customer info
      setCheckoutData(prev => ({
        ...prev,
        firstName: customer.firstName || prev.firstName,
        lastName: customer.lastName || prev.lastName,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
      }));

      // Then, if we have saved addresses, use the default shipping address
      if (userAddresses && userAddresses.length > 0) {
        const defaultAddress = userAddresses.find((addr: any) => addr.isDefault || addr.isDefaultShipping) || userAddresses[0];
        if (defaultAddress) {
          setCheckoutData(prev => ({
            ...prev,
            address: defaultAddress.line1,
            address2: defaultAddress.line2 || '',
            city: defaultAddress.city,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
            state: defaultAddress.state || '',
          }));
        }
      }
    }
  }, [customer, userAddresses]);

  // Allow guest checkout, no login required

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <CelioFooter />
      </div>
    );
  }

  const items = cart ? (Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items as string || '[]')) : [];
  const subtotal = parseFloat(cart?.subtotal || '29.99'); // Default to test amount if no cart
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <button 
            onClick={() => setLocation('/cart')}
            className="hover:text-gray-700"
            data-testid="link-cart"
          >
            Carrello
          </button>
          <span>/</span>
          <span className="text-gray-900">Checkout</span>
        </div>

        {/* Auth Choice Step */}
        {paymentStep === 'auth-choice' && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
              <p className="text-gray-600">Accedi al tuo account o procedi come ospite</p>
            </div>

            <div className="space-y-4">
              {/* Login Option */}
              <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setPaymentStep('login')}>
                <div className="flex items-center space-x-4">
                  <div className="bg-black text-white p-3 rounded-full">
                    <Shield size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Accedi al tuo account</h3>
                    <p className="text-gray-600 text-sm">I tuoi dati saranno precompilati automaticamente</p>
                  </div>
                  <ArrowLeft className="transform rotate-180" size={20} />
                </div>
              </Card>

              {/* Guest Checkout Option */}
              <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={handleGuestCheckout}>
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-600 text-white p-3 rounded-full">
                    <Truck size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Continua come ospite</h3>
                    <p className="text-gray-600 text-sm">Inserisci i tuoi dati di spedizione e pagamento</p>
                  </div>
                  <ArrowLeft className="transform rotate-180" size={20} />
                </div>
              </Card>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                Non hai un account? 
                <button 
                  onClick={() => setLocation('/register')}
                  className="text-black hover:underline ml-1 font-medium"
                >
                  Registrati qui
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Login Step */}
        {paymentStep === 'login' && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Accedi</h1>
              <p className="text-gray-600">Inserisci le tue credenziali per accedere</p>
            </div>

            <Card className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    data-testid="input-login-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    data-testid="input-login-password"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToAuthChoice}
                    className="flex-1"
                  >
                    Indietro
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-black hover:bg-gray-800"
                  >
                    {processing ? 'Accesso...' : 'Accedi'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Guest Details Step */}
        {paymentStep === 'guest-details' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout Ospite</h1>
              <p className="text-gray-600">Inserisci i tuoi dati per completare l'ordine</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Importante:</strong> I tuoi dati saranno utilizzati sia per la spedizione che per il pagamento. 
                Assicurati che l'indirizzo sia corretto per evitare problemi di consegna.
              </p>
            </div>

            <Button
              onClick={handleBackToAuthChoice}
              variant="outline"
              className="mb-6"
            >
              <ArrowLeft size={16} className="mr-2" />
              Torna alla scelta
            </Button>

            <Button
              onClick={() => setPaymentStep('details')}
              className="w-full bg-black hover:bg-gray-800 text-white py-3"
            >
              Procedi con i dati
            </Button>
          </div>
        )}

        {/* Main Checkout Form - Only show if logged in or proceeding as guest */}
        {(paymentStep === 'details' || paymentStep === 'payment') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Checkout Form */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Finalizza il tuo ordine</h1>
                {isGuest && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    Ospite
                  </span>
                )}
              </div>

              {/* Pre-filled Address Notification */}
              {user && user.address && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-green-600" size={20} />
                    <div>
                      <p className="font-medium text-green-900">
                        Indirizzo di spedizione caricato
                      </p>
                      <p className="text-sm text-green-700">
                        I tuoi dati sono stati precompilati dal tuo profilo. Puoi modificarli se necessario.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Reminder */}
              {isGuest && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Truck className="text-orange-600" size={20} />
                    <div>
                      <p className="font-medium text-orange-900">
                        Checkout come ospite
                      </p>
                      <p className="text-sm text-orange-700">
                        Compila tutti i campi obbligatori per completare l'ordine.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informazioni di contatto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={checkoutData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={checkoutData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        data-testid="input-firstName"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Cognome *</Label>
                      <Input
                        id="lastName"
                        value={checkoutData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        data-testid="input-lastName"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={checkoutData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Indirizzo di spedizione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Indirizzo *</Label>
                    <Input
                      id="address"
                      value={checkoutData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      data-testid="input-address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Città *</Label>
                      <Input
                        id="city"
                        value={checkoutData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">CAP *</Label>
                      <Input
                        id="postalCode"
                        value={checkoutData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                        data-testid="input-postalCode"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Paese</Label>
                    <Input
                      id="country"
                      value={checkoutData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled
                      data-testid="input-country"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metodo di pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stripe Credit Card */}
                    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="payment"
                          value="stripe"
                          checked={checkoutData.paymentMethod === 'stripe'}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          data-testid="radio-payment-stripe"
                        />
                        <CreditCard className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Carta di credito/debito</div>
                          <div className="text-sm text-gray-500">Pagamento sicuro con Stripe</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <img src={visaLogo} alt="Visa" className="h-6" />
                        <img src={masterCardLogo} alt="Mastercard" className="h-6" />
                      </div>
                    </label>

                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riepilogo ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {items.map((item: CartItem, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm" data-testid={`text-item-name-${index}`}>
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Quantità: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium" data-testid={`text-item-total-${index}`}>
                          {(item.price * item.quantity).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotale:</span>
                    <span data-testid="text-subtotal">{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spedizione:</span>
                    <span data-testid="text-shipping">
                      {shipping === 0 ? 'Gratuita' : `${shipping.toFixed(2)}€`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Totale:</span>
                    <span data-testid="text-total">{total.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Truck className="w-4 h-4" />
                    <span>Spedizione gratuita sopra i 50€</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span>Pagamento sicuro e protetto</span>
                  </div>
                </div>

                {/* Stripe Payment Form or Complete Order Button */}
                {paymentStep === 'payment' && checkoutData.paymentMethod === 'stripe' && clientSecret ? (
                  <div className="mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h3 className="font-medium text-blue-900 mb-2">💳 Inserisci i dati della carta</h3>
                      <p className="text-sm text-blue-700">
                        Usa la carta di test: <strong>4242 4242 4242 4242</strong>
                      </p>
                    </div>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm 
                        clientSecret={clientSecret} 
                        total={total} 
                        onSuccess={() => setLocation('/payment/success')} 
                      />
                    </Elements>
                  </div>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="w-full mt-6 bg-black hover:bg-gray-800 text-white py-3"
                    disabled={processing || processOrderMutation.isPending}
                    data-testid="button-complete-order"
                  >
                    {processing || processOrderMutation.isPending ? 
                      'Elaborazione...' : 
                      paymentStep === 'payment' ? 
                        `Procedi al pagamento - ${total.toFixed(2)}€` :
                        `Completa ordine - ${total.toFixed(2)}€`
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
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