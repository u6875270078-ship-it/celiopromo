import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Building, ShoppingCart, Euro, TrendingUp, Package, FileText, Calendar, Star, CheckCircle, AlertTriangle, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const AdminSuppliers: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPurchaseOrders, setShowPurchaseOrders] = useState(false);
  const [showSupplierAnalytics, setShowSupplierAnalytics] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const suppliers = [
    {
      id: 1,
      name: 'Fournisseur Textile Paris',
      email: 'contact@textile-paris.fr',
      phone: '+33 1 23 45 67 89',
      address: '12 Rue de la Mode, 75001 Paris',
      category: 'Textile',
      productsCount: 45,
      lastOrder: '2024-01-10',
      status: 'active',
      rating: 4.8
    },
    {
      id: 2,
      name: 'Mode & Style Distribution',
      email: 'orders@modestyle.com',
      phone: '+33 1 34 56 78 90',
      address: '56 Avenue de la Fashion, 69002 Lyon',
      category: 'Accessoires',
      productsCount: 23,
      lastOrder: '2024-01-08',
      status: 'active',
      rating: 4.5
    },
    {
      id: 3,
      name: 'Urban Street Supplier',
      email: 'supply@urbanstreet.fr',
      phone: '+33 1 45 67 89 01',
      address: '89 Boulevard du Style, 13001 Marseille',
      category: 'Streetwear',
      productsCount: 67,
      lastOrder: '2024-01-05',
      status: 'active',
      rating: 4.2
    },
    {
      id: 4,
      name: 'Chic Parisien Wholesale',
      email: 'contact@chicparisien.com',
      phone: '+33 1 56 78 90 12',
      address: '34 Rue Élégante, 33000 Bordeaux',
      category: 'Haute Couture',
      productsCount: 12,
      lastOrder: '2023-12-20',
      status: 'inactive',
      rating: 4.0
    }
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Actif' : 'Inactif';
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  // Enhanced supplier data with Italian suppliers and additional metrics
  const enhancedSuppliers = suppliers.map(supplier => ({
    ...supplier,
    monthlyVolume: supplier.id === 1 ? 25000 : supplier.id === 2 ? 18500 : supplier.id === 3 ? 32000 : 8500,
    totalOrders: supplier.id === 1 ? 156 : supplier.id === 2 ? 89 : supplier.id === 3 ? 234 : 45,
    onTimeDelivery: supplier.id === 1 ? 95.2 : supplier.id === 2 ? 92.8 : supplier.id === 3 ? 88.5 : 85.0,
    qualityRating: supplier.id === 1 ? 4.7 : supplier.id === 2 ? 4.6 : supplier.id === 3 ? 4.3 : 4.1
  }));

  // Mock purchase orders data
  const purchaseOrders = [
    {
      id: 'PO-001',
      supplierId: 1,
      supplierName: 'Tessile Milano Premium',
      orderDate: '2024-01-15',
      expectedDelivery: '2024-01-25',
      status: 'pending',
      totalAmount: 4500.00,
      items: 25
    },
    {
      id: 'PO-002',
      supplierId: 2,
      supplierName: 'Moda Italia Distribuzione',
      orderDate: '2024-01-12',
      expectedDelivery: '2024-01-22',
      status: 'confirmed',
      totalAmount: 3200.00,
      items: 18
    },
    {
      id: 'PO-003',
      supplierId: 3,
      supplierName: 'Urban Style Fornitore',
      orderDate: '2024-01-08',
      expectedDelivery: '2024-01-18',
      status: 'delivered',
      totalAmount: 6750.00,
      items: 42
    }
  ];

  // Enhanced helper functions
  const getPerformanceLevel = (rating: number, onTime: number) => {
    if (rating >= 4.5 && onTime >= 90) return { level: 'Eccellente', color: 'bg-green-100 text-green-800' };
    if (rating >= 4.0 && onTime >= 85) return { level: 'Buono', color: 'bg-blue-100 text-blue-800' };
    if (rating >= 3.5 && onTime >= 80) return { level: 'Discreto', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Da Migliorare', color: 'bg-red-100 text-red-800' };
  };

  const getPurchaseOrderStatus = (status: string) => {
    const statusMap = {
      pending: { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confermato', color: 'bg-blue-100 text-blue-800' },
      delivered: { label: 'Consegnato', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annullato', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Enhanced analytics calculations
  const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalMonthlyVolume = enhancedSuppliers.reduce((sum, s) => sum + s.monthlyVolume, 0);
  const avgDeliveryPerformance = enhancedSuppliers.reduce((sum, s) => sum + s.onTimeDelivery, 0) / enhancedSuppliers.length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestion des fournisseurs</h1>
            <p className="text-gray-600">Gérez vos partenaires et fournisseurs</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={20} />
            Ajouter un fournisseur
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cerca per nome, email o categoria..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Enhanced Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornitori Totali</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">Partnership attive</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornitori Attivi</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
              <p className="text-xs text-muted-foreground">Collaborazioni attive</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Mensile</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{(totalMonthlyVolume / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Valore mensile medio</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordini di Acquisto</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders.length}</div>
              <p className="text-xs text-muted-foreground">Ordini attivi</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Consegne</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgDeliveryPerformance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Puntualità media</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating Medio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Qualità media</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Purchase Orders Panel */}
      {showPurchaseOrders && (
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Gestione Ordini di Acquisto
            </CardTitle>
            <CardDescription>
              Monitora e gestisci gli ordini di acquisto dai fornitori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseOrders.map((po) => {
                const status = getPurchaseOrderStatus(po.status);
                return (
                  <div key={po.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Ordine #{po.id}</div>
                        <div className="text-sm text-gray-600">{po.supplierName}</div>
                        <div className="text-xs text-gray-500">{po.items} articoli • Consegna: {format(new Date(po.expectedDelivery), 'dd/MM/yyyy')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">€{po.totalAmount.toFixed(2)}</div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuovo Ordine di Acquisto
                  </Button>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Valore Totale Ordini</div>
                    <div className="text-xl font-bold text-blue-600">€{totalPurchaseValue.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Analytics Panel */}
      {showSupplierAnalytics && (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics Performance Fornitori
            </CardTitle>
            <CardDescription>
              Analisi dettagliate delle performance e qualità dei fornitori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => {
                const performance = getPerformanceLevel(supplier.rating, supplier.onTimeDelivery);
                return (
                  <div key={supplier.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{supplier.name}</div>
                      <Badge className={performance.color}>{performance.level}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volume Mensile:</span>
                        <span className="font-medium">€{supplier.monthlyVolume.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ordini Totali:</span>
                        <span className="font-medium">{supplier.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Puntualità:</span>
                        <span className={`font-medium ${
                          supplier.onTimeDelivery >= 90 ? 'text-green-600' : 
                          supplier.onTimeDelivery >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{supplier.onTimeDelivery}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Qualità:</span>
                        <div className="flex items-center gap-1">
                          {getRatingStars(supplier.qualityRating)}
                          <span className="ml-1 text-xs">({supplier.qualityRating})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enhancedSuppliers.filter(supplier =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">{supplier.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supplier.status)}`}>
                  {getStatusText(supplier.status)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {supplier.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {supplier.phone}
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  {supplier.address}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Prodotti</span>
                  <span className="text-sm font-medium text-gray-800">{supplier.productsCount}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Ultimo Ordine</span>
                  <span className="text-sm font-medium text-gray-800">
                    {format(new Date(supplier.lastOrder), 'dd/MM/yyyy', { locale: it })}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Valutazione</span>
                  <div className="flex items-center">
                    {getRatingStars(supplier.rating)}
                    <span className="ml-1 text-sm text-gray-600">({supplier.rating})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Performance</span>
                  <Badge className={getPerformanceLevel(supplier.rating, supplier.onTimeDelivery).color + ' text-xs'}>
                    {getPerformanceLevel(supplier.rating, supplier.onTimeDelivery).level}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <TrendingUp className="h-3 w-3" />
                  Analytics
                </Button>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" title="Modifica">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700" title="Crea Ordine">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" title="Elimina">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Building className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun fornitore trovato</h3>
          <p className="text-sm text-gray-500">Modifica i criteri di ricerca o aggiungi un nuovo fornitore.</p>
        </div>
      )}
    </div>
  );
};

export default AdminSuppliers;