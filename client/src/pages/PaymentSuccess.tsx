import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Check, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clear cart from localStorage since payment was successful
    localStorage.removeItem('cart');
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <Check className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pagamento completato con successo!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Grazie per il tuo ordine! Riceverai una conferma via email a breve.
          </p>

          {/* Order Details Card */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-center space-x-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Il tuo ordine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Numero ordine:</strong> #ORD-{Date.now()}</p>
                <p><strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}</p>
                <p><strong>Stato:</strong> <span className="text-green-600">Confermato</span></p>
              </div>
              
              <div className="pt-4 border-t text-sm text-gray-600">
                <p>• Riceverai un'email di conferma a breve</p>
                <p>• Il tracking di spedizione sarà disponibile entro 24 ore</p>
                <p>• La consegna è prevista in 2-3 giorni lavorativi</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="button-home"
            >
              <Home className="w-4 h-4" />
              <span>Torna alla home</span>
            </Button>
            <Button
              onClick={() => setLocation('/catalog')}
              className="bg-black hover:bg-gray-800 text-white flex items-center space-x-2"
              data-testid="button-continue-shopping"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continua a fare shopping</span>
            </Button>
          </div>

          {/* Additional Information */}
          <div className="mt-12 text-sm text-gray-500">
            <p>Hai domande sul tuo ordine?</p>
            <p>Contattaci all'indirizzo: <a href="mailto:support@celio.it" className="text-black hover:underline">support@celio.it</a></p>
          </div>
        </div>
      </main>

      <CelioFooter />
    </div>
  );
}