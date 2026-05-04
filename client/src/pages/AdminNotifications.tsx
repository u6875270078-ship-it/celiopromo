import React, { useState, useEffect } from 'react';
import { Bell, Scan, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Package, BarChart, Eye, Search, Filter, Calendar, Download, Euro, Users, Truck, RotateCcw, Target, CreditCard, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  category: string;
  alertType: 'RUPTURE' | 'FAIBLE' | 'CRITIQUE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  resolved: boolean;
}

interface InventoryReport {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalItems: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
    stockLevel: number;
  }>;
  stockByCategory: Array<{
    category: string;
    totalStock: number;
    lowStock: number;
    outOfStock: number;
  }>;
}

interface FinancialAlert {
  id: string;
  type: 'PAYMENT_OVERDUE' | 'BUDGET_EXCEEDED' | 'LOW_MARGIN' | 'CASH_FLOW' | 'TAX_DEADLINE';
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  category: 'Pagamenti' | 'Budget' | 'Profitti' | 'Tasse' | 'Cash Flow';
}

interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  reason: 'DIFETTOSO' | 'TAGLIA_ERRATA' | 'NON_CONFORME' | 'CAMBIATO_IDEA' | 'ALTRO';
  status: 'NUOVO' | 'IN_REVISIONE' | 'APPROVATO' | 'RIFIUTATO' | 'RIMBORSATO';
  requestDate: string;
  refundAmount: number;
  notes: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ForecastAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  predictedOutOfStock: string;
  recommendedOrderQuantity: number;
  forecastAccuracy: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  seasonality: boolean;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM';
  category: string;
}

const AdminNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'reports' | 'analytics' | 'financial' | 'returns' | 'forecast'>('alerts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RUPTURE' | 'FAIBLE' | 'CRITIQUE'>('ALL');
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stock alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/admin/stock-alerts'],
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });

  // Fetch inventory report
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['/api/admin/inventory-report'],
    refetchInterval: 60000, // Aggiorna ogni minuto
  });

  // Fetch top selling products analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/sales-analytics'],
    refetchInterval: 300000, // Aggiorna ogni 5 minuti
  });

  // Mock data for new features - in real app these would be API calls
  const financialAlerts: FinancialAlert[] = [
    {
      id: 'FA001',
      type: 'PAYMENT_OVERDUE',
      title: 'Pagamento Scaduto - Fornitore Milano Fashion',
      description: 'Fattura scaduta da 15 giorni per ordine tessuti',
      amount: 8750.00,
      dueDate: '2024-01-01',
      priority: 'URGENT',
      status: 'PENDING',
      createdAt: '2024-01-16',
      category: 'Pagamenti'
    },
    {
      id: 'FA002', 
      type: 'BUDGET_EXCEEDED',
      title: 'Budget Marketing Superato',
      description: 'Spese marketing gennaio hanno superato budget del 23%',
      amount: 2340.00,
      dueDate: '2024-02-01',
      priority: 'HIGH',
      status: 'ACKNOWLEDGED',
      createdAt: '2024-01-15',
      category: 'Budget'
    },
    {
      id: 'FA003',
      type: 'LOW_MARGIN',
      title: 'Margine Profitto Basso - Categoria Scarpe',
      description: 'Margine profitto sotto il 15% per categoria scarpe',
      amount: 0,
      dueDate: '2024-01-20',
      priority: 'MEDIUM',
      status: 'PENDING',
      createdAt: '2024-01-14',
      category: 'Profitti'
    }
  ];

  const returnRequests: ReturnRequest[] = [
    {
      id: 'RR001',
      orderId: 'ORD-2024-001',
      customerId: 'CUST001',
      customerName: 'Marco Rossi',
      customerEmail: 'marco.rossi@email.com',
      productName: 'Camicia Slim Fit Blu',
      quantity: 1,
      reason: 'TAGLIA_ERRATA',
      status: 'NUOVO',
      requestDate: '2024-01-16',
      refundAmount: 49.99,
      notes: 'Taglia troppo grande, richiesta taglia M invece di L',
      priority: 'MEDIUM'
    },
    {
      id: 'RR002',
      orderId: 'ORD-2024-002',
      customerId: 'CUST002',
      customerName: 'Laura Bianchi',
      customerEmail: 'laura.bianchi@email.com',
      productName: 'Pantalone Chino Navy',
      quantity: 1,
      reason: 'DIFETTOSO',
      status: 'IN_REVISIONE',
      requestDate: '2024-01-15',
      refundAmount: 69.99,
      notes: 'Cucitura difettosa sulla gamba sinistra',
      priority: 'HIGH'
    },
    {
      id: 'RR003',
      orderId: 'ORD-2024-003',
      customerId: 'CUST003',
      customerName: 'Alessandro Verde',
      customerEmail: 'a.verde@email.com',
      productName: 'Maglione Cashmere Grigio',
      quantity: 1,
      reason: 'CAMBIATO_IDEA',
      status: 'APPROVATO',
      requestDate: '2024-01-14',
      refundAmount: 129.99,
      notes: 'Cliente ha cambiato idea, prodotto mai indossato',
      priority: 'LOW'
    }
  ];

  const forecastAlerts: ForecastAlert[] = [
    {
      id: 'FC001',
      productId: 'PROD001',
      productName: 'Jeans Slim Fit Nero',
      currentStock: 15,
      predictedOutOfStock: '2024-02-05',
      recommendedOrderQuantity: 50,
      forecastAccuracy: 87.5,
      trend: 'INCREASING',
      seasonality: false,
      priority: 'URGENT',
      category: 'Pantaloni'
    },
    {
      id: 'FC002',
      productId: 'PROD002', 
      productName: 'Polo Basic Bianca',
      currentStock: 32,
      predictedOutOfStock: '2024-02-15',
      recommendedOrderQuantity: 75,
      forecastAccuracy: 92.3,
      trend: 'STABLE',
      seasonality: true,
      priority: 'HIGH',
      category: 'Magliette'
    },
    {
      id: 'FC003',
      productId: 'PROD003',
      productName: 'Scarpe Derby Marroni',
      currentStock: 8,
      predictedOutOfStock: '2024-01-28',
      recommendedOrderQuantity: 25,
      forecastAccuracy: 78.9,
      trend: 'DECREASING',
      seasonality: false,
      priority: 'MEDIUM',
      category: 'Scarpe'
    }
  ];

  // Scan inventory mutation
  const scanInventoryMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/scan-inventory', 'POST', {}),
    onMutate: () => {
      setScanning(true);
    },
    onSuccess: (data) => {
      toast({
        title: "Scansione Completata",
        description: `Scansionati ${data.scannedProducts} prodotti. ${data.newAlerts} nuovi alert trovati.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory-report'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore Scansione",
        description: error.message,
      });
    },
    onSettled: () => {
      setScanning(false);
    },
  });

  // Filter alerts based on search and filter type
  const filteredAlerts = ((alerts as StockAlert[]) || []).filter((alert: StockAlert) => {
    const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || alert.alertType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getAlertBadgeColor = (alertType: string) => {
    switch (alertType) {
      case 'RUPTURE': return 'bg-red-100 text-red-800 border-red-200';
      case 'FAIBLE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITIQUE': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM': return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <Package className="h-4 w-4 text-blue-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Sistema Notifiche Stock
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoraggio inventario, alert scorte e analisi vendite in tempo reale
          </p>
        </div>
        <Button
          onClick={() => scanInventoryMutation.mutate()}
          disabled={scanning}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          data-testid="button-scan-inventory"
        >
          <Scan className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scansione...' : 'Scansiona Stock'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Rupture Stock</p>
              <p className="text-2xl font-bold text-red-700">{(report as InventoryReport)?.outOfStockItems || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Stock Faible</p>
              <p className="text-2xl font-bold text-yellow-700">{(report as InventoryReport)?.lowStockItems || 0}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Prodotti Totali</p>
              <p className="text-2xl font-bold text-blue-700">{(report as InventoryReport)?.totalProducts || 0}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Stock Totale</p>
              <p className="text-2xl font-bold text-green-700">{(report as InventoryReport)?.totalStock || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-alerts"
          >
            <Bell className="inline h-4 w-4 mr-1" />
            Alert Stock ({filteredAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-financial"
          >
            <Euro className="inline h-4 w-4 mr-1" />
            Alert Finanziari ({financialAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap ${
              activeTab === 'returns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-returns"
          >
            <RotateCcw className="inline h-4 w-4 mr-1" />
            Resi e Rimborsi ({returnRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-forecast"
          >
            <Target className="inline h-4 w-4 mr-1" />
            Previsioni Stock ({forecastAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-reports"
          >
            <BarChart className="inline h-4 w-4 mr-1" />
            Rapporti Stock
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid="tab-analytics"
          >
            <TrendingUp className="inline h-4 w-4 mr-1" />
            Top Vendite
          </button>
        </nav>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cerca per nome prodotto o categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search-alerts"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="select-alert-filter"
            >
              <option value="ALL">Tutti gli alert</option>
              <option value="RUPTURE">Solo rotture stock</option>
              <option value="FAIBLE">Solo stock faible</option>
              <option value="CRITIQUE">Solo critici</option>
            </select>
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Alert Stock Attivi ({filteredAlerts.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {alertsLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Caricamento alert...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Nessun alert trovato</p>
                </div>
              ) : (
                filteredAlerts.map((alert: StockAlert) => (
                  <div key={alert.id} className="p-4 hover:bg-gray-50" data-testid={`alert-${alert.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getPriorityIcon(alert.priority)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{alert.productName}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAlertBadgeColor(alert.alertType)}`}>
                              {alert.alertType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Categoria: {alert.category}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              Stock attuale: <span className="font-medium text-gray-900">{alert.currentStock}</span>
                            </span>
                            <span className="text-gray-600">
                              Minimo: <span className="font-medium text-red-600">{alert.minStock}</span>
                            </span>
                            <span className="text-gray-600">
                              Massimo: <span className="font-medium text-blue-600">{alert.maxStock}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleString('it-IT')}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          data-testid={`button-view-product-${alert.productId}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Visualizza
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock by Category */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Stock per Categoria
              </h3>
              <div className="space-y-3">
                {(report as InventoryReport)?.stockByCategory?.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{category.category}</p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Totale: {category.totalStock}</span>
                        <span>Faible: {category.lowStock}</span>
                        <span>Rupture: {category.outOfStock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Azioni Rapide
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-export-alerts"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta Alert CSV
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-print-report"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Stampa Rapporto
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-schedule-report"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programma Rapporto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab - Top Selling Products */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Prodotti Migliori Vendite
              </h3>
              <p className="text-gray-600 mt-1">
                Analisi prestazioni prodotti e correlazione con livelli stock
              </p>
            </div>
            <div className="p-6">
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Caricamento analytics...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(report as InventoryReport)?.topSellingProducts?.map((product: any, index: number) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      data-testid={`top-product-${product.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            Venduti: {product.totalSold} | Ricavi: €{product.revenue?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.stockLevel <= 10 
                            ? 'bg-red-100 text-red-800' 
                            : product.stockLevel <= 20 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          Stock: {product.stockLevel}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {product.stockLevel <= 10 ? 'Riordina urgente' : 
                           product.stockLevel <= 20 ? 'Monitorare' : 'OK'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Financial Alerts Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Euro className="h-5 w-5 text-red-600" />
                    Alert Finanziari ERP
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Monitora pagamenti, budget e margini profitto per mantenere la salute finanziaria
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Esporta Report
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {financialAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.priority === 'URGENT' 
                        ? 'border-red-500 bg-red-50' 
                        : alert.priority === 'HIGH' 
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-yellow-500 bg-yellow-50'
                    }`}
                    data-testid={`financial-alert-${alert.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg">{alert.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            alert.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.priority === 'URGENT' ? 'URGENTE' : 
                             alert.priority === 'HIGH' ? 'ALTA' : 'MEDIA'}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {alert.category}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{alert.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {alert.amount > 0 && (
                            <div>
                              <span className="text-gray-600">Importo:</span>
                              <span className="font-bold text-red-600 ml-2">€{alert.amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Scadenza:</span>
                            <span className="font-medium ml-2">{new Date(alert.dueDate).toLocaleDateString('it-IT')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Creato:</span>
                            <span className="font-medium ml-2">{new Date(alert.createdAt).toLocaleDateString('it-IT')}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Stato:</span>
                            <span className={`font-medium ml-2 ${
                              alert.status === 'PENDING' ? 'text-red-600' : 
                              alert.status === 'ACKNOWLEDGED' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {alert.status === 'PENDING' ? 'In Attesa' : 
                               alert.status === 'ACKNOWLEDGED' ? 'Preso in Carico' : 'Risolto'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" className="text-green-600">
                          Risolvi
                        </Button>
                        <Button size="sm" variant="outline" className="text-blue-600">
                          Dettagli
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                    Gestione Resi e Rimborsi
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Gestisci richieste di reso, rimborsi e sostituzioni clienti
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtra
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Esporta
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {returnRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`return-request-${request.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg">Richiesta #{request.id}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'NUOVO' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'IN_REVISIONE' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'APPROVATO' ? 'bg-green-100 text-green-800' :
                            request.status === 'RIFIUTATO' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {request.status === 'NUOVO' ? 'Nuovo' :
                             request.status === 'IN_REVISIONE' ? 'In Revisione' :
                             request.status === 'APPROVATO' ? 'Approvato' :
                             request.status === 'RIFIUTATO' ? 'Rifiutato' : 'Rimborsato'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority === 'HIGH' ? 'Alta' : 
                             request.priority === 'MEDIUM' ? 'Media' : 'Bassa'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Cliente</p>
                            <p className="font-medium">{request.customerName}</p>
                            <p className="text-sm text-gray-500">{request.customerEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Prodotto</p>
                            <p className="font-medium">{request.productName}</p>
                            <p className="text-sm text-gray-500">Ordine: {request.orderId}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" className="text-green-600">
                          Approva
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          Rifiuta
                        </Button>
                        <Button size="sm" variant="outline" className="text-blue-600">
                          Dettagli
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Quantità:</span>
                        <span className="font-medium ml-2">{request.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rimborso:</span>
                        <span className="font-medium text-green-600 ml-2">€{request.refundAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Motivo:</span>
                        <span className="font-medium ml-2">
                          {request.reason === 'DIFETTOSO' ? 'Difettoso' :
                           request.reason === 'TAGLIA_ERRATA' ? 'Taglia Errata' :
                           request.reason === 'NON_CONFORME' ? 'Non Conforme' :
                           request.reason === 'CAMBIATO_IDEA' ? 'Cambiato Idea' : 'Altro'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Richiesta:</span>
                        <span className="font-medium ml-2">{new Date(request.requestDate).toLocaleDateString('it-IT')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">ID Cliente:</span>
                        <span className="font-medium ml-2">{request.customerId}</span>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Note:</p>
                        <p className="text-sm">{request.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Previsioni Stock Intelligenti
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Analisi predittiva per ottimizzare gli ordini e prevenire rotture di stock
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Aggiorna Previsioni
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Report Forecasting
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {forecastAlerts.map((forecast) => (
                  <div
                    key={forecast.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      forecast.priority === 'URGENT' 
                        ? 'border-red-500 bg-red-50' 
                        : forecast.priority === 'HIGH' 
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-blue-500 bg-blue-50'
                    }`}
                    data-testid={`forecast-alert-${forecast.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-bold text-lg">{forecast.productName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            forecast.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            forecast.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {forecast.priority === 'URGENT' ? 'URGENTE' : 
                             forecast.priority === 'HIGH' ? 'ALTA' : 'MEDIA'}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            {forecast.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            forecast.trend === 'INCREASING' ? 'bg-green-100 text-green-800' :
                            forecast.trend === 'DECREASING' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {forecast.trend === 'INCREASING' ? '📈 Crescita' :
                             forecast.trend === 'DECREASING' ? '📉 Calo' : '➡️ Stabile'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">{forecast.currentStock}</div>
                            <div className="text-sm text-blue-700">Stock Attuale</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-red-600">
                              {new Date(forecast.predictedOutOfStock).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-sm text-red-700">Esaurimento Previsto</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-green-600">{forecast.recommendedOrderQuantity}</div>
                            <div className="text-sm text-green-700">Ordine Consigliato</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-purple-600">{forecast.forecastAccuracy}%</div>
                            <div className="text-sm text-purple-700">Accuratezza</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-orange-600">
                              {forecast.seasonality ? '🔄' : '➡️'}
                            </div>
                            <div className="text-sm text-orange-700">
                              {forecast.seasonality ? 'Stagionale' : 'Costante'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                            <span>Giorni rimanenti fino esaurimento</span>
                            <span>
                              {Math.ceil((new Date(forecast.predictedOutOfStock).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} giorni
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                Math.ceil((new Date(forecast.predictedOutOfStock).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 7 
                                  ? 'bg-red-500' 
                                  : Math.ceil((new Date(forecast.predictedOutOfStock).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 14
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, Math.max(10, (Math.ceil((new Date(forecast.predictedOutOfStock).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) / 30) * 100))}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          Crea Ordine
                        </Button>
                        <Button size="sm" variant="outline" className="text-blue-600">
                          Dettagli
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;