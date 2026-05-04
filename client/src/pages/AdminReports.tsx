import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Package, Euro, Calendar, Download, FileText, Target, Eye, Filter, RefreshCw, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AdminReports: React.FC = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<'sales' | 'inventory' | 'financial' | 'customers' | 'marketing'>('sales');
  const [dateRange, setDateRange] = useState('30');

  // Mock reporting data
  const reportCategories = [
    {
      id: 'sales',
      name: 'Report Vendite',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: 12
    },
    {
      id: 'inventory',
      name: 'Report Inventario',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: 8
    },
    {
      id: 'financial',
      name: 'Report Finanziari',
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: 15
    },
    {
      id: 'customers',
      name: 'Report Clienti',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: 9
    },
    {
      id: 'marketing',
      name: 'Report Marketing',
      icon: Target,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      count: 6
    }
  ];

  const salesReports = [
    {
      id: 'SR001',
      name: 'Analisi Vendite Mensili',
      description: 'Trend vendite, prodotti top, performance categorie',
      type: 'Vendite',
      lastGenerated: '2024-01-16',
      status: 'ready',
      downloadUrl: '/reports/monthly-sales.pdf',
      metrics: {
        revenue: 45680.00,
        orders: 234,
        avgOrderValue: 195.20,
        growth: '+12.5%'
      }
    },
    {
      id: 'SR002',
      name: 'Performance Prodotti',
      description: 'Bestseller, margini, rotazione stock per prodotto',
      type: 'Prodotti',
      lastGenerated: '2024-01-15',
      status: 'ready',
      downloadUrl: '/reports/product-performance.xlsx',
      metrics: {
        topProduct: 'Jeans Slim Fit',
        totalProducts: 156,
        profitMargin: '23.4%',
        stockTurnover: '4.2x'
      }
    },
    {
      id: 'SR003',
      name: 'Analisi Canali Vendita',
      description: 'Confronto online vs negozi, conversioni, ROI',
      type: 'Canali',
      lastGenerated: '2024-01-14',
      status: 'processing',
      downloadUrl: null,
      metrics: {
        onlineRevenue: '67%',
        storeRevenue: '33%',
        onlineConversion: '3.2%',
        storeConversion: '8.1%'
      }
    }
  ];

  const inventoryReports = [
    {
      id: 'IR001',
      name: 'Stato Stock Corrente',
      description: 'Livelli stock, alert, previsioni riordino',
      type: 'Stock',
      lastGenerated: '2024-01-16',
      status: 'ready',
      downloadUrl: '/reports/current-stock.xlsx',
      metrics: {
        totalValue: '€89,450',
        lowStockItems: 23,
        outOfStock: 4,
        avgStockDays: '45'
      }
    },
    {
      id: 'IR002',
      name: 'Movimenti Inventario',
      description: 'Storico entrate/uscite, trend stagionali',
      type: 'Movimenti',
      lastGenerated: '2024-01-15',
      status: 'ready',
      downloadUrl: '/reports/inventory-movements.pdf',
      metrics: {
        inbound: 1234,
        outbound: 2156,
        netChange: '-922',
        accuracy: '99.2%'
      }
    }
  ];

  const financialReports = [
    {
      id: 'FR001',
      name: 'Profit & Loss Statement',
      description: 'Conto economico dettagliato con margini per categoria',
      type: 'P&L',
      lastGenerated: '2024-01-16',
      status: 'ready',
      downloadUrl: '/reports/profit-loss.pdf',
      metrics: {
        revenue: '€156,780',
        costs: '€89,450',
        netProfit: '€67,330',
        margin: '42.9%'
      }
    },
    {
      id: 'FR002',
      name: 'Cash Flow Analysis',
      description: 'Flussi di cassa operativi, investimenti, finanziamenti',
      type: 'Cash Flow',
      lastGenerated: '2024-01-15',
      status: 'ready',
      downloadUrl: '/reports/cash-flow.xlsx',
      metrics: {
        operating: '€45,200',
        investing: '-€12,300',
        financing: '€8,900',
        netCash: '€41,800'
      }
    },
    {
      id: 'FR003',
      name: 'Budget vs Actual',
      description: 'Confronto budget pianificato vs risultati effettivi',
      type: 'Budget',
      lastGenerated: '2024-01-14',
      status: 'ready',
      downloadUrl: '/reports/budget-analysis.pdf',
      metrics: {
        budgetAccuracy: '94.2%',
        revenueVariance: '+5.8%',
        costVariance: '-2.3%',
        profitVariance: '+12.1%'
      }
    }
  ];

  const customerReports = [
    {
      id: 'CR001',
      name: 'Customer Lifetime Value',
      description: 'Valore cliente, segmentazione, churn analysis',
      type: 'CLV',
      lastGenerated: '2024-01-16',
      status: 'ready',
      downloadUrl: '/reports/customer-lifetime-value.xlsx',
      metrics: {
        avgCLV: '€456.30',
        churnRate: '2.3%',
        retention: '91.2%',
        newCustomers: 89
      }
    },
    {
      id: 'CR002',
      name: 'Analisi Comportamento Clienti',
      description: 'Pattern acquisto, preferenze, stagionalità',
      type: 'Comportamento',
      lastGenerated: '2024-01-15',
      status: 'ready',
      downloadUrl: '/reports/customer-behavior.pdf',
      metrics: {
        avgOrderValue: '€125.50',
        frequency: '2.8/mese',
        topCategory: 'Abbigliamento',
        peakHours: '15:00-18:00'
      }
    }
  ];

  const marketingReports = [
    {
      id: 'MR001',
      name: 'ROI Campagne Marketing',
      description: 'Performance campagne, conversioni, costo acquisizione',
      type: 'ROI',
      lastGenerated: '2024-01-16',
      status: 'ready',
      downloadUrl: '/reports/marketing-roi.pdf',
      metrics: {
        totalROI: '420%',
        avgCAC: '€23.50',
        bestChannel: 'Email',
        worstChannel: 'Display'
      }
    },
    {
      id: 'MR002',
      name: 'Email Marketing Performance',
      description: 'Open rate, click rate, conversioni email campaigns',
      type: 'Email',
      lastGenerated: '2024-01-15',
      status: 'ready',
      downloadUrl: '/reports/email-performance.xlsx',
      metrics: {
        openRate: '24.8%',
        clickRate: '4.7%',
        conversionRate: '2.1%',
        revenue: '€12,450'
      }
    }
  ];

  const getCurrentReports = () => {
    switch (activeCategory) {
      case 'sales': return salesReports;
      case 'inventory': return inventoryReports;
      case 'financial': return financialReports;
      case 'customers': return customerReports;
      case 'marketing': return marketingReports;
      default: return salesReports;
    }
  };

  const generateReport = (reportId: string) => {
    toast({
      title: "📊 Generazione Report Avviata",
      description: "Il report sarà pronto tra pochi minuti. Ti invieremo una notifica."
    });
  };

  const downloadReport = (reportName: string, url: string | null, reportData?: any) => {
    if (!url) {
      toast({
        title: "⚠️ Report Non Disponibile",
        description: "Il report è ancora in elaborazione."
      });
      return;
    }

    try {
      // Generate actual downloadable content based on the active category
      const currentReports = getCurrentReports();
      const report = currentReports.find(r => r.name === reportName);
      
      if (!report) {
        toast({
          title: "❌ Errore",
          description: "Report non trovato."
        });
        return;
      }

      // Generate CSV/Excel content based on report type
      let content = '';
      let filename = '';
      let mimeType = '';

      if (url.includes('.xlsx')) {
        // Excel format
        filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        content = generateExcelContent(report, activeCategory);
      } else {
        // PDF/CSV format  
        filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        content = generateCSVContent(report, activeCategory);
      }

      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "✅ Download Completato",
        description: `"${reportName}" scaricato con successo!`
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "❌ Errore Download",
        description: "Si è verificato un errore durante il download."
      });
    }
  };

  const generateCSVContent = (report: any, category: string) => {
    const headers = ['Metrica', 'Valore', 'Data Generazione', 'Tipo Report'];
    const rows = [headers];
    
    // Add report basic info
    rows.push(['Nome Report', report.name, report.lastGenerated, report.type]);
    rows.push(['Descrizione', report.description, '', '']);
    rows.push(['Stato', report.status === 'ready' ? 'Pronto' : 'In Elaborazione', '', '']);
    rows.push(['', '', '', '']); // Empty row
    
    // Add metrics
    rows.push(['METRICHE PRINCIPALI', '', '', '']);
    Object.entries(report.metrics).forEach(([key, value]) => {
      const metricName = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase());
      rows.push([metricName, String(value), '', '']);
    });

    // Add category-specific data
    rows.push(['', '', '', '']); // Empty row
    rows.push(['CATEGORIA', category.toUpperCase(), '', '']);
    rows.push(['Data Esportazione', new Date().toLocaleDateString('it-IT'), '', '']);
    rows.push(['Ora Esportazione', new Date().toLocaleTimeString('it-IT'), '', '']);
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateExcelContent = (report: any, category: string) => {
    // For Excel, we'll generate CSV format as well since creating real Excel requires additional libraries
    // In a real implementation, you'd use libraries like 'xlsx' or 'exceljs'
    let content = `Report ERP Celio - ${report.name}\n`;
    content += `Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}\n\n`;
    
    content += `Categoria,${category.toUpperCase()}\n`;
    content += `Tipo Report,${report.type}\n`;
    content += `Descrizione,"${report.description}"\n`;
    content += `Ultimo Aggiornamento,${report.lastGenerated}\n`;
    content += `Stato,${report.status === 'ready' ? 'Pronto' : 'In Elaborazione'}\n\n`;
    
    content += `METRICHE PRINCIPALI\n`;
    content += `Metrica,Valore\n`;
    Object.entries(report.metrics).forEach(([key, value]) => {
      const metricName = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase());
      content += `"${metricName}","${value}"\n`;
    });
    
    content += `\n--- Fine Report ---\n`;
    content += `Report generato dal Sistema ERP Celio\n`;
    content += `© ${new Date().getFullYear()} Celio Italia\n`;
    
    return content;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Centro Reporting ERP</h1>
              <p className="text-gray-600">Analisi complete e report personalizzati per il business intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7">Ultimi 7 giorni</option>
              <option value="30">Ultimi 30 giorni</option>
              <option value="90">Ultimi 3 mesi</option>
              <option value="365">Anno corrente</option>
            </select>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna Dati
            </Button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {reportCategories.map((category) => (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all ${
                activeCategory === category.id 
                  ? 'ring-2 ring-blue-500 shadow-md' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setActiveCategory(category.id as any)}
            >
              <CardContent className="p-4 text-center">
                <div className={`inline-flex p-3 rounded-full ${category.bgColor} mb-3`}>
                  <category.icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.count} report</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {reportCategories.find(c => c.id === activeCategory)?.name}
          </CardTitle>
          <CardDescription>
            Report disponibili per la categoria selezionata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {getCurrentReports().map((report) => (
              <div key={report.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl">{report.name}</h3>
                      <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                        {report.status === 'ready' ? '✅ Pronto' : 
                         report.status === 'processing' ? '⏳ Elaborazione' : '❌ Errore'}
                      </Badge>
                      <Badge variant="outline">{report.type}</Badge>
                    </div>
                    <p className="text-gray-700 mb-4">{report.description}</p>
                    <p className="text-sm text-gray-500">
                      Ultimo aggiornamento: {new Date(report.lastGenerated).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport(report.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Rigenera
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => downloadReport(report.name, report.downloadUrl)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(report.metrics).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-blue-600">{value}</div>
                      <div className="text-xs text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Report Programmati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configura report automatici via email
            </p>
            <Button variant="outline" className="w-full">
              Gestisci Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Dashboard Personalizzata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Crea dashboard con KPI personalizzati
            </p>
            <Button variant="outline" className="w-full">
              Crea Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-600" />
              Analytics Real-time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Monitora metriche in tempo reale
            </p>
            <Button variant="outline" className="w-full">
              Visualizza Live
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;