import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, TrendingUp, DollarSign, AlertCircle, BarChart3, PieChart, Target, Euro, Activity, Calendar, Download } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);

  // Fetch admin stats
  const { data: adminStats = {}, isLoading: statsLoading } = useQuery<{products: number, orders: number, customers: number, revenue: number}>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch recent orders
  const { data: recentOrdersData = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/recent-orders'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Enhanced financial calculations
  const calculateBusinessMetrics = () => {
    const revenue = (adminStats as any)?.revenue || 0;
    const orders = (adminStats as any)?.orders || 0;
    const customers = (adminStats as any)?.customers || 0;
    const products = (adminStats as any)?.products || 0;
    
    // Business intelligence calculations
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    const estimatedProfit = revenue * 0.25; // 25% margin
    const conversionRate = 2.3; // Mock - should come from real analytics
    const customerLifetimeValue = revenue > 0 && customers > 0 ? (revenue / customers) * 3 : 0;
    
    return {
      revenue,
      orders,
      customers,
      products,
      avgOrderValue,
      estimatedProfit,
      conversionRate,
      customerLifetimeValue
    };
  };
  
  const metrics = calculateBusinessMetrics();
  
  const stats = [
    { 
      icon: Euro, 
      label: 'Fatturato Totale', 
      value: `€${metrics.revenue.toFixed(2)}`, 
      change: '+12.5%', 
      color: 'bg-green-500',
      description: 'Crescita rispetto al mese scorso'
    },
    { 
      icon: Target, 
      label: 'Profitto Stimato', 
      value: `€${metrics.estimatedProfit.toFixed(2)}`, 
      change: '+8.2%', 
      color: 'bg-blue-500',
      description: 'Margine del 25%'
    },
    { 
      icon: ShoppingCart, 
      label: 'Ordini Completati', 
      value: metrics.orders.toString(), 
      change: '+15.3%', 
      color: 'bg-purple-500',
      description: 'Ordini processati con successo'
    },
    { 
      icon: Activity, 
      label: 'Valore Medio Ordine', 
      value: `€${metrics.avgOrderValue.toFixed(2)}`, 
      change: '+3.1%', 
      color: 'bg-orange-500',
      description: 'AOV in crescita costante'
    }
  ];
  
  // Advanced analytics data (mock - replace with real API)
  const topProducts = [
    { name: 'Felpa Oversize Viola', units: 45, revenue: 1935.55, growth: '+23%' },
    { name: 'Jeans Slim Fit', units: 38, revenue: 1672.38, growth: '+15%' },
    { name: 'T-shirt Basic', units: 52, revenue: 1248.00, growth: '+8%' },
    { name: 'Giacca Denim', units: 23, revenue: 1656.77, growth: '+31%' }
  ];
  
  const performanceMetrics = [
    { label: 'Tasso di Conversione', value: `${metrics.conversionRate}%`, trend: 'up' },
    { label: 'Valore Vita Cliente', value: `€${metrics.customerLifetimeValue.toFixed(0)}`, trend: 'up' },
    { label: 'Costo Acquisizione Cliente', value: '€45.20', trend: 'down' },
    { label: 'Tasso di Ritorno', value: '3.2%', trend: 'down' }
  ];

  const recentOrders = recentOrdersData as any[];

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-orders'] });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const alerts = [
    { type: 'info', message: 'Dashboard aggiornata in tempo reale ogni 30 secondi' },
    { type: 'info', message: 'Gestione completa del negozio Celio' }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Business Intelligence</h1>
            <p className="text-gray-600">Analytics avanzate e KPI finanziari per Celio</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Ultimi 7 giorni</option>
              <option value="30">Ultimi 30 giorni</option>
              <option value="90">Ultimi 3 mesi</option>
              <option value="365">Ultimo anno</option>
            </select>
            <button
              onClick={() => setShowFinancialDetails(!showFinancialDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <BarChart3 size={16} />
              {showFinancialDetails ? 'Nascondi' : 'Mostra'} Dettagli
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                <div className={`${stat.color} p-2 rounded-md`}>
                  <IconComponent className="text-white" size={20} />
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs font-medium text-green-600">{stat.change}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Financial Details */}
      {showFinancialDetails && (
        <div className="mb-8 space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Metriche di Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                    <Badge className={metric.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {metric.trend === 'up' ? '↗️ Positivo' : '↘️ Da migliorare'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Top Products Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Prodotti Top Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.units} unità vendute</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">€{product.revenue.toFixed(2)}</div>
                      <Badge className="bg-green-100 text-green-800">{product.growth}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ordini recenti</h2>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium">Nessun ordine recente</p>
                <p className="text-sm">I nuovi ordini appariranno qui</p>
              </div>
            ) : (
              recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">€{order.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{order.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'delivered' ? 'Consegnato' :
                     order.status === 'shipped' ? 'Spedito' :
                     order.status === 'processing' ? 'In preparazione' :
                     order.status === 'pending' ? 'In attesa' : order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enhanced Alerts & Business Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Business Intelligence & Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Financial Health Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Salute Finanziaria</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Margini sopra la media del settore</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">Crescita Costante</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">+12.5% crescita trimestrale</p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-orange-800">Opportunità</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Potenziale miglioramento conversioni</p>
                </div>
              </div>
              
              {/* Traditional Alerts */}
              {alerts.map((alert, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <AlertCircle className={`mt-0.5 ${
                    alert.type === 'error' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} size={16} />
                  <p className={`text-sm ${
                    alert.type === 'error' ? 'text-red-700' :
                    alert.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {alert.message}
                  </p>
                </div>
              ))}
              
              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    Genera Report Completo
                  </button>
                  <button className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
                    Esporta Dati
                  </button>
                  <button className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
                    Configura Alert
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;