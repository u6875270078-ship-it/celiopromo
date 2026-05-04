import React, { useState } from 'react';
import { TrendingUp, Users, Euro, Eye, Megaphone, Percent, Gift, Mail, Calendar, Target, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AdminMarketing: React.FC = () => {
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Mock marketing data
  const marketingStats = {
    totalCampaigns: 8,
    activeCampaigns: 3,
    totalRevenue: 45680.00,
    conversionRate: 3.2,
    emailSubscribers: 2847,
    openRate: 24.8
  };

  const activeCampaigns = [
    {
      id: 1,
      name: 'Saldi Estivi 2024',
      type: 'Discount',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      budget: 5000,
      spent: 3200,
      conversions: 127,
      revenue: 8450
    },
    {
      id: 2,
      name: 'Email Welcome Series',
      type: 'Email',
      status: 'active',
      startDate: '2024-01-10',
      endDate: '2024-12-31',
      budget: 800,
      spent: 420,
      conversions: 89,
      revenue: 6780
    },
    {
      id: 3,
      name: 'Promozione Nuovi Clienti',
      type: 'Promotion',
      status: 'scheduled',
      startDate: '2024-01-20',
      endDate: '2024-01-30',
      budget: 3000,
      spent: 0,
      conversions: 0,
      revenue: 0
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Discount':
        return 'bg-purple-100 text-purple-800';
      case 'Email':
        return 'bg-blue-100 text-blue-800';
      case 'Promotion':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Centro Marketing ERP</h1>
              <p className="text-gray-600">Gestisci campagne, promozioni e analytics per massimizzare le vendite Celio</p>
            </div>
          </div>
          <Button 
            className="bg-pink-600 hover:bg-pink-700"
            onClick={() => setShowCampaignModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuova Campagna
          </Button>
        </div>
      </div>

      {/* Marketing KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagne Totali</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {marketingStats.activeCampaigns} attive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi Marketing</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{marketingStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">+12.5% vs mese scorso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Conversione</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.conversionRate}%</div>
            <p className="text-xs text-green-600">+0.4% vs media</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iscritti Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.emailSubscribers.toLocaleString()}</div>
            <p className="text-xs text-green-600">+156 questo mese</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Apertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingStats.openRate}%</div>
            <p className="text-xs text-yellow-600">-1.2% vs media settore</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2x</div>
            <p className="text-xs text-green-600">Ritorno investimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-purple-200 hover:border-purple-400 cursor-pointer transition-colors">
          <CardHeader className="text-center">
            <Percent className="h-8 w-8 text-purple-600 mx-auto" />
            <CardTitle className="text-lg">Codici Sconto</CardTitle>
            <CardDescription>
              Crea e gestisci codici promozionali per incrementare le vendite
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Gestisci Sconti
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 hover:border-orange-400 cursor-pointer transition-colors">
          <CardHeader className="text-center">
            <Gift className="h-8 w-8 text-orange-600 mx-auto" />
            <CardTitle className="text-lg">Promozioni</CardTitle>
            <CardDescription>
              Pianifica offerte speciali e campagne stagionali
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Crea Promozioni
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 hover:border-blue-400 cursor-pointer transition-colors">
          <CardHeader className="text-center">
            <Mail className="h-8 w-8 text-blue-600 mx-auto" />
            <CardTitle className="text-lg">Email Marketing</CardTitle>
            <CardDescription>
              Invia newsletter e campagne email personalizzate
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Email Campaigns
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:border-green-400 cursor-pointer transition-colors">
          <CardHeader className="text-center">
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto" />
            <CardTitle className="text-lg">Analytics</CardTitle>
            <CardDescription>
              Analizza performance e ROI delle tue campagne
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full">
              Visualizza Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campagne Attive
          </CardTitle>
          <CardDescription>
            Monitora le performance delle campagne marketing in corso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getTypeColor(campaign.type)}>{campaign.type}</Badge>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status === 'active' ? 'Attiva' : 
                           campaign.status === 'scheduled' ? 'Programmata' : 
                           campaign.status === 'completed' ? 'Completata' : 'In Pausa'}
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

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Periodo</p>
                    <p className="font-medium">
                      {new Date(campaign.startDate).toLocaleDateString('it-IT')} - 
                      {new Date(campaign.endDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Budget</p>
                    <p className="font-medium">€{campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Speso</p>
                    <p className="font-medium text-blue-600">€{campaign.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversioni</p>
                    <p className="font-medium text-green-600">{campaign.conversions}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ricavi</p>
                    <p className="font-medium text-green-600">€{campaign.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ROI</p>
                    <p className="font-medium text-purple-600">
                      {campaign.spent > 0 ? `${(campaign.revenue / campaign.spent).toFixed(1)}x` : '-'}
                    </p>
                  </div>
                </div>

                {campaign.budget > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                      <span>Utilizzo Budget</span>
                      <span>{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketing;