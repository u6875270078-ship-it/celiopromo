import React, { useState } from 'react';
import { Gift, Plus, Edit, Trash2, Calendar, Target, TrendingUp, Users, Euro, Eye, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AdminPromotions: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock promotions data
  const promotions = [
    {
      id: 1,
      name: 'Saldi di Fine Stagione',
      description: 'Sconti fino al 50% su tutta la collezione autunno/inverno',
      type: 'seasonal_sale',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      discountType: 'percentage',
      discountValue: 30,
      minOrderAmount: 75,
      targetAudience: 'Tutti i clienti',
      usageCount: 1247,
      revenue: 48750.00,
      impressions: 15420,
      clicks: 2890,
      conversions: 234,
      budget: 5000,
      spent: 3200,
      categories: ['Abbigliamento', 'Accessori'],
      priority: 'high'
    },
    {
      id: 2,
      name: 'Benvenuto Nuovi Clienti',
      description: 'Sconto speciale per i primi acquisti',
      type: 'welcome_offer',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 50,
      targetAudience: 'Nuovi clienti',
      usageCount: 189,
      revenue: 8950.00,
      impressions: 2340,
      clicks: 456,
      conversions: 89,
      budget: 2000,
      spent: 1200,
      categories: ['Tutti'],
      priority: 'medium'
    },
    {
      id: 3,
      name: 'Buy 2 Get 1 Free - Magliette',
      description: 'Compra 2 magliette e ricevi la terza gratis',
      type: 'bundle_offer',
      status: 'scheduled',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      discountType: 'buy_x_get_y',
      discountValue: 33.33,
      minOrderAmount: 0,
      targetAudience: 'Clienti frequenti',
      usageCount: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      budget: 3000,
      spent: 0,
      categories: ['Magliette'],
      priority: 'high'
    },
    {
      id: 4,
      name: 'Flash Sale Weekend',
      description: 'Promozione flash di 48 ore con sconti esclusivi',
      type: 'flash_sale',
      status: 'completed',
      startDate: '2024-01-06',
      endDate: '2024-01-08',
      discountType: 'percentage',
      discountValue: 25,
      minOrderAmount: 30,
      targetAudience: 'Iscritti newsletter',
      usageCount: 567,
      revenue: 21340.00,
      impressions: 8750,
      clicks: 1890,
      conversions: 156,
      budget: 1500,
      spent: 1500,
      categories: ['Selezione speciale'],
      priority: 'urgent'
    },
    {
      id: 5,
      name: 'Promozione San Valentino',
      description: 'Regali perfetti per San Valentino con packaging speciale',
      type: 'holiday_promo',
      status: 'paused',
      startDate: '2024-02-10',
      endDate: '2024-02-14',
      discountType: 'fixed_amount',
      discountValue: 20,
      minOrderAmount: 80,
      targetAudience: 'Tutti i clienti',
      usageCount: 45,
      revenue: 1890.00,
      impressions: 1250,
      clicks: 234,
      conversions: 23,
      budget: 2500,
      spent: 890,
      categories: ['Regali', 'Accessori'],
      priority: 'medium'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'seasonal_sale':
        return 'bg-purple-100 text-purple-800';
      case 'welcome_offer':
        return 'bg-green-100 text-green-800';
      case 'bundle_offer':
        return 'bg-orange-100 text-orange-800';
      case 'flash_sale':
        return 'bg-red-100 text-red-800';
      case 'holiday_promo':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPromotions = promotions.filter(promo =>
    promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const activeCount = promotions.filter(p => p.status === 'active').length;
  const totalRevenue = promotions.reduce((sum, p) => sum + p.revenue, 0);
  const totalConversions = promotions.reduce((sum, p) => sum + p.conversions, 0);
  const totalImpressions = promotions.reduce((sum, p) => sum + p.impressions, 0);
  const avgConversionRate = totalImpressions > 0 ? (totalConversions / totalImpressions * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gestione Promozioni</h1>
              <p className="text-gray-600">Crea, monitora e ottimizza le promozioni per massimizzare le vendite Celio</p>
            </div>
          </div>
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuova Promozione
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promozioni Attive</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {promotions.length - activeCount} completate/programmate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi Totali</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">+18.5% vs mese scorso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversioni</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-blue-600">Tasso: {avgConversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressioni</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-purple-600">Visibilità promozioni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.2x</div>
            <p className="text-xs text-green-600">Ritorno investimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti Coinvolti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,247</div>
            <p className="text-xs text-blue-600">Reach mensile</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtra e Cerca Promozioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Cerca per nome o descrizione..."
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

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Elenco Promozioni ({filteredPromotions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredPromotions.map((promo) => (
              <div key={promo.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2">{promo.name}</h3>
                        <p className="text-gray-700 mb-3">{promo.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(promo.status)}>
                            {promo.status === 'active' ? 'Attiva' : 
                             promo.status === 'scheduled' ? 'Programmata' :
                             promo.status === 'completed' ? 'Completata' :
                             promo.status === 'paused' ? 'In Pausa' : 'Scaduta'}
                          </Badge>
                          <Badge className={getTypeColor(promo.type)}>
                            {promo.type === 'seasonal_sale' ? 'Saldi Stagionali' :
                             promo.type === 'welcome_offer' ? 'Offerta Benvenuto' :
                             promo.type === 'bundle_offer' ? 'Bundle Offer' :
                             promo.type === 'flash_sale' ? 'Flash Sale' : 'Promozione Festiva'}
                          </Badge>
                          <Badge className={getPriorityColor(promo.priority)}>
                            {promo.priority === 'urgent' ? 'Urgente' :
                             promo.priority === 'high' ? 'Alta' :
                             promo.priority === 'medium' ? 'Media' : 'Bassa'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {promo.discountType === 'percentage' ? `${promo.discountValue}%` : 
                       promo.discountType === 'fixed_amount' ? `€${promo.discountValue}` : 
                       promo.discountType === 'buy_x_get_y' ? `${promo.discountValue.toFixed(0)}%` : 'Gratis'}
                    </div>
                    <div className="text-sm text-blue-700">Sconto</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">€{promo.revenue.toLocaleString()}</div>
                    <div className="text-sm text-green-700">Ricavi</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{promo.usageCount}</div>
                    <div className="text-sm text-purple-700">Utilizzi</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{promo.conversions}</div>
                    <div className="text-sm text-orange-700">Conversioni</div>
                    <div className="text-xs text-orange-600">
                      {promo.impressions > 0 ? ((promo.conversions / promo.impressions) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{promo.impressions.toLocaleString()}</div>
                    <div className="text-sm text-yellow-700">Impressioni</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {promo.spent > 0 ? `${(promo.revenue / promo.spent).toFixed(1)}x` : '-'}
                    </div>
                    <div className="text-sm text-red-700">ROI</div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Periodo Valido</p>
                    <p className="font-medium">
                      {new Date(promo.startDate).toLocaleDateString('it-IT')} - 
                      {new Date(promo.endDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ordine Minimo</p>
                    <p className="font-medium">
                      {promo.minOrderAmount > 0 ? `€${promo.minOrderAmount}` : 'Nessun minimo'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pubblico Target</p>
                    <p className="font-medium">{promo.targetAudience}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Categorie</p>
                    <p className="font-medium">{promo.categories.join(', ')}</p>
                  </div>
                </div>

                {/* Budget Progress */}
                {promo.budget > 0 && (
                  <div>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                      <span>Budget Utilizzo</span>
                      <span>€{promo.spent.toLocaleString()} / €{promo.budget.toLocaleString()} ({((promo.spent / promo.budget) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          promo.spent >= promo.budget ? 'bg-red-500' :
                          (promo.spent / promo.budget) > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((promo.spent / promo.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredPromotions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Gift className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna promozione trovata</h3>
              <p className="text-sm text-gray-500">Modifica i criteri di ricerca o crea una nuova promozione.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPromotions;