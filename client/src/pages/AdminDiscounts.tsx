import React, { useState } from 'react';
import { Percent, Plus, Edit, Trash2, Copy, Calendar, Users, Euro, Target, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AdminDiscounts: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock discount codes data
  const discountCodes = [
    {
      id: 1,
      code: 'ESTATE2024',
      type: 'percentage',
      value: 20,
      description: 'Sconto Estivo 20%',
      minOrder: 50,
      maxDiscount: 100,
      usageLimit: 500,
      usageCount: 287,
      validFrom: '2024-01-15',
      validTo: '2024-02-15',
      status: 'active',
      applicableProducts: 'all',
      createdBy: 'Admin'
    },
    {
      id: 2,
      code: 'NUOVICLIENTI15',
      type: 'percentage',
      value: 15,
      description: 'Benvenuto Nuovi Clienti',
      minOrder: 30,
      maxDiscount: 50,
      usageLimit: 100,
      usageCount: 43,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      status: 'active',
      applicableProducts: 'new_customers_only',
      createdBy: 'Manager'
    },
    {
      id: 3,
      code: 'SPEDGRATIS',
      type: 'free_shipping',
      value: 0,
      description: 'Spedizione Gratuita',
      minOrder: 40,
      maxDiscount: 15,
      usageLimit: 1000,
      usageCount: 756,
      validFrom: '2024-01-10',
      validTo: '2024-01-31',
      status: 'active',
      applicableProducts: 'all',
      createdBy: 'Admin'
    },
    {
      id: 4,
      code: 'BLACKFRIDAY30',
      type: 'percentage',
      value: 30,
      description: 'Black Friday Mega Sconto',
      minOrder: 80,
      maxDiscount: 200,
      usageLimit: 200,
      usageCount: 200,
      validFrom: '2023-11-24',
      validTo: '2023-11-27',
      status: 'expired',
      applicableProducts: 'selected_categories',
      createdBy: 'Admin'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'fixed_amount':
        return 'bg-green-100 text-green-800';
      case 'free_shipping':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "✅ Codice Copiato!",
        description: `Il codice "${code}" è stato copiato negli appunti`
      });
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile copiare il codice"
      });
    }
  };

  const filteredCodes = discountCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const activeCount = discountCodes.filter(c => c.status === 'active').length;
  const totalUsage = discountCodes.reduce((sum, c) => sum + c.usageCount, 0);
  const totalSavings = discountCodes.reduce((sum, c) => {
    return sum + (c.type === 'percentage' ? (c.usageCount * c.value) : (c.usageCount * 5.90));
  }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Percent className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gestione Codici Sconto</h1>
              <p className="text-gray-600">Crea, monitora e ottimizza i codici promozionali per aumentare le conversioni</p>
            </div>
          </div>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Codice Sconto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Codici Attivi</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {discountCodes.length - activeCount} scaduti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizzi Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-green-600">+23% vs mese scorso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risparmi Clienti</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSavings.toLocaleString()}</div>
            <p className="text-xs text-blue-600">Valore scontato totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Conversione</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7%</div>
            <p className="text-xs text-green-600">+0.8% vs media</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtra e Cerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Cerca per codice o descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtri Avanzati
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discount Codes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Elenco Codici Sconto ({filteredCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCodes.map((code) => (
              <div key={code.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl font-mono bg-gray-100 px-3 py-1 rounded">
                          {code.code}
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(code.code)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-lg text-gray-700 mb-2">{code.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(code.type)}>
                          {code.type === 'percentage' ? 'Percentuale' :
                           code.type === 'fixed_amount' ? 'Importo Fisso' : 'Spedizione Gratuita'}
                        </Badge>
                        <Badge className={getStatusColor(code.status)}>
                          {code.status === 'active' ? 'Attivo' : 
                           code.status === 'expired' ? 'Scaduto' : 'In Pausa'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Valore Sconto</p>
                    <p className="font-bold text-lg text-purple-600">
                      {code.type === 'percentage' ? `${code.value}%` : 
                       code.type === 'fixed_amount' ? `€${code.value}` : 'Gratuita'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ordine Minimo</p>
                    <p className="font-medium">€{code.minOrder}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sconto Max</p>
                    <p className="font-medium">€{code.maxDiscount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utilizzi</p>
                    <p className="font-medium">
                      {code.usageCount}/{code.usageLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Validità</p>
                    <p className="font-medium">
                      {new Date(code.validFrom).toLocaleDateString('it-IT')} - 
                      {new Date(code.validTo).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Creato da</p>
                    <p className="font-medium">{code.createdBy}</p>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                    <span>Utilizzo</span>
                    <span>{((code.usageCount / code.usageLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        code.usageCount >= code.usageLimit ? 'bg-red-500' :
                        (code.usageCount / code.usageLimit) > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((code.usageCount / code.usageLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Applicabile a:</strong> 
                    {code.applicableProducts === 'all' ? ' Tutti i prodotti' :
                     code.applicableProducts === 'new_customers_only' ? ' Solo nuovi clienti' :
                     code.applicableProducts === 'selected_categories' ? ' Categorie selezionate' : ' Prodotti specifici'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredCodes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Percent className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun codice sconto trovato</h3>
              <p className="text-sm text-gray-500">Modifica i criteri di ricerca o crea un nuovo codice sconto.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDiscounts;