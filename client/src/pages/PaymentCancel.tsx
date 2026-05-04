import { useLocation } from 'wouter';
import { X, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import CelioFooter from '@/components/CelioFooter';

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-8">
            <X className="w-12 h-12 text-red-600" />
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pagamento annullato
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Il pagamento è stato annullato. Nessun addebito è stato effettuato.
          </p>

          {/* Information Card */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Cosa è successo?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600">
              <div>
                <p>Il pagamento potrebbe essere stato annullato per diversi motivi:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Hai chiuso la finestra di pagamento</li>
                  <li>Hai premuto il pulsante "Annulla"</li>
                  <li>Si è verificato un problema con il provider di pagamento</li>
                  <li>La sessione è scaduta</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t">
                <p><strong>I tuoi articoli sono ancora nel carrello</strong></p>
                <p>Puoi ritentare il pagamento in qualsiasi momento.</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/cart')}
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="button-back-to-cart"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna al carrello</span>
            </Button>
            <Button
              onClick={() => setLocation('/checkout')}
              className="bg-black hover:bg-gray-800 text-white flex items-center space-x-2"
              data-testid="button-retry-payment"
            >
              <CreditCard className="w-4 h-4" />
              <span>Ritenta il pagamento</span>
            </Button>
          </div>

          {/* Help Information */}
          <div className="mt-12 text-sm text-gray-500">
            <p>Hai bisogno di assistenza?</p>
            <p>Contattaci all'indirizzo: <a href="mailto:support@celio.it" className="text-black hover:underline">support@celio.it</a></p>
            <p>Oppure chiama il nostro servizio clienti: <span className="text-black">+39 02 1234 5678</span></p>
          </div>
        </div>
      </main>

      <CelioFooter />
    </div>
  );
}