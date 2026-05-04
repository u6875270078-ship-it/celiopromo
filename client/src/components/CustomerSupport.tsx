import { useState } from 'react';
import { Phone, Mail, Clock, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function CustomerSupport() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Messaggio inviato!",
          description: "Ti risponderemo il prima possibile, solitamente entro 24 ore.",
        });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setShowContactForm(false);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Errore nell'invio",
        description: "Si è verificato un errore. Riprova più tardi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Assistenza Clienti Celio
          </h2>
          <p className="text-gray-600 text-lg">
            Siamo qui per aiutarti. Contattaci per qualsiasi domanda o supporto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Email Support */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-sm text-gray-600 mb-3">
                Scrivici per qualsiasi domanda
              </p>
              <p className="text-sm font-medium text-blue-600">
                supporto@celio.com
              </p>
            </div>
          </div>

          {/* Phone Support */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Telefono</h3>
              <p className="text-sm text-gray-600 mb-3">
                Chiamaci per supporto immediato
              </p>
              <p className="text-sm font-medium text-green-600">
                +39 02 1234 5678
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Orari</h3>
              <p className="text-sm text-gray-600 mb-3">
                Lunedì - Venerdì
              </p>
              <p className="text-sm font-medium text-purple-600">
                9:00 - 18:00
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contattaci</h3>
              <p className="text-sm text-gray-600 mb-4">
                Invia un messaggio diretto
              </p>
              <Button 
                onClick={() => setShowContactForm(true)}
                className="w-full bg-orange-600 hover:bg-orange-700"
                data-testid="button-contact-form"
              >
                Scrivi un messaggio
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Help Links */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            Link Utili
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <a href="/profile" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              📦 Traccia Ordine
            </a>
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              🔄 Resi & Cambi
            </a>
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              📏 Guida Taglie
            </a>
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ❓ FAQ
            </a>
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    Contattaci
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowContactForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                    data-testid="button-close-contact"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Il tuo nome"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="tua.email@esempio.com"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono (opzionale)
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oggetto *
                  </label>
                  <Input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Di cosa hai bisogno?"
                    required
                    data-testid="input-subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Descrivi la tua richiesta..."
                    rows={4}
                    required
                    data-testid="textarea-message"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-send-message"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Invio in corso...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="w-4 h-4 mr-2" />
                        Invia Messaggio
                      </span>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Ti risponderemo entro 24 ore lavorative
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}