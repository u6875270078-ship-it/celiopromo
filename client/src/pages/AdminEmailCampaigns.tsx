import React, { useState } from 'react';
import { Mail, Plus, Edit, Trash2, Send, Users, Eye, MousePointer, Calendar, TrendingUp, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AdminEmailCampaigns: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock email campaigns data
  const emailCampaigns = [
    {
      id: 1,
      name: 'Newsletter Gennaio 2024',
      subject: '🔥 Nuove Collezioni e Sconti Esclusivi ti Aspettano!',
      type: 'newsletter',
      status: 'sent',
      sentDate: '2024-01-15T10:00:00Z',
      scheduledDate: null,
      recipientCount: 2847,
      openCount: 706,
      clickCount: 142,
      unsubscribeCount: 8,
      bounceCount: 12,
      revenue: 3450.00,
      segments: ['Tutti gli Iscritti'],
      template: 'celio_newsletter_template',
      createdBy: 'Marketing Team'
    },
    {
      id: 2,
      name: 'Welcome Series - Email 1',
      subject: 'Benvenuto in Celio! Ecco il tuo sconto di benvenuto 🎁',
      type: 'automated',
      status: 'active',
      sentDate: null,
      scheduledDate: null,
      recipientCount: 156,
      openCount: 89,
      clickCount: 34,
      unsubscribeCount: 2,
      bounceCount: 1,
      revenue: 890.00,
      segments: ['Nuovi Iscritti'],
      template: 'welcome_email_template',
      createdBy: 'Admin'
    },
    {
      id: 3,
      name: 'Carrello Abbandonato - Reminder',
      subject: 'Hai dimenticato qualcosa nel tuo carrello? 🛒',
      type: 'automated',
      status: 'active',
      sentDate: null,
      scheduledDate: null,
      recipientCount: 423,
      openCount: 198,
      clickCount: 67,
      unsubscribeCount: 5,
      bounceCount: 3,
      revenue: 2340.00,
      segments: ['Carrello Abbandonato'],
      template: 'abandoned_cart_template',
      createdBy: 'Marketing Team'
    },
    {
      id: 4,
      name: 'Promozione San Valentino',
      subject: '💝 Regali Perfetti per San Valentino - Sconti fino al 30%',
      type: 'promotional',
      status: 'scheduled',
      sentDate: null,
      scheduledDate: '2024-02-10T09:00:00Z',
      recipientCount: 2450,
      openCount: 0,
      clickCount: 0,
      unsubscribeCount: 0,
      bounceCount: 0,
      revenue: 0,
      segments: ['Clienti Attivi', 'VIP'],
      template: 'valentine_promo_template',
      createdBy: 'Admin'
    },
    {
      id: 5,
      name: 'Survey Post-Acquisto',
      subject: 'Come è stata la tua esperienza con Celio? ⭐',
      type: 'transactional',
      status: 'paused',
      sentDate: null,
      scheduledDate: null,
      recipientCount: 89,
      openCount: 34,
      clickCount: 12,
      unsubscribeCount: 1,
      bounceCount: 0,
      revenue: 0,
      segments: ['Acquirenti Recenti'],
      template: 'survey_template',
      createdBy: 'Customer Service'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter':
        return 'bg-blue-100 text-blue-800';
      case 'promotional':
        return 'bg-red-100 text-red-800';
      case 'automated':
        return 'bg-green-100 text-green-800';
      case 'transactional':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCampaigns = emailCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalSent = emailCampaigns.reduce((sum, c) => sum + c.recipientCount, 0);
  const totalOpened = emailCampaigns.reduce((sum, c) => sum + c.openCount, 0);
  const totalClicked = emailCampaigns.reduce((sum, c) => sum + c.clickCount, 0);
  const totalRevenue = emailCampaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent * 100) : 0;
  const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened * 100) : 0;

  const sendTestEmail = (campaignId: number) => {
    toast({
      title: "📧 Email di Test Inviata",
      description: "L'email di test è stata inviata al tuo indirizzo email."
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Email Marketing Campaigns</h1>
              <p className="text-gray-600">Gestisci newsletter, email automatiche e campagne promozionali per Celio</p>
            </div>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuova Campagna Email
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Inviate</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-green-600">+12% vs mese scorso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Apertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-blue-600">{totalOpened.toLocaleString()} aperture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Click</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</div>
            <p className="text-xs text-purple-600">{totalClicked.toLocaleString()} click</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricavi Email</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">ROI: 8.2x</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagne Attive</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailCampaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Automazioni in corso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iscritti Attivi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-green-600">+156 questo mese</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtra e Cerca Campagne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Cerca per nome campagna o oggetto email..."
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

      {/* Email Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Elenco Campagne Email ({filteredCampaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1">{campaign.name}</h3>
                        <p className="text-gray-700 text-lg mb-3 italic">"{campaign.subject}"</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status === 'sent' ? 'Inviata' : 
                             campaign.status === 'active' ? 'Attiva' :
                             campaign.status === 'scheduled' ? 'Programmata' :
                             campaign.status === 'paused' ? 'In Pausa' : 'Bozza'}
                          </Badge>
                          <Badge className={getTypeColor(campaign.type)}>
                            {campaign.type === 'newsletter' ? 'Newsletter' :
                             campaign.type === 'promotional' ? 'Promozionale' :
                             campaign.type === 'automated' ? 'Automatica' : 'Transazionale'}
                          </Badge>
                          <Badge variant="outline">{campaign.segments.join(', ')}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => sendTestEmail(campaign.id)}>
                      <Send className="h-4 w-4" />
                    </Button>
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
                    <div className="text-2xl font-bold text-blue-600">{campaign.recipientCount.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">Destinatari</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{campaign.openCount.toLocaleString()}</div>
                    <div className="text-sm text-green-700">Aperture</div>
                    <div className="text-xs text-green-600">
                      {campaign.recipientCount > 0 ? ((campaign.openCount / campaign.recipientCount) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{campaign.clickCount}</div>
                    <div className="text-sm text-purple-700">Click</div>
                    <div className="text-xs text-purple-600">
                      {campaign.openCount > 0 ? ((campaign.clickCount / campaign.openCount) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">€{campaign.revenue.toLocaleString()}</div>
                    <div className="text-sm text-orange-700">Ricavi</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{campaign.unsubscribeCount}</div>
                    <div className="text-sm text-red-700">Disiscrizioni</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{campaign.bounceCount}</div>
                    <div className="text-sm text-yellow-700">Rimbalzi</div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Template</p>
                    <p className="font-medium">{campaign.template}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Creato da</p>
                    <p className="font-medium">{campaign.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Data Invio/Programma</p>
                    <p className="font-medium">
                      {campaign.sentDate ? 
                        new Date(campaign.sentDate).toLocaleDateString('it-IT') + ' ' + 
                        new Date(campaign.sentDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) :
                        campaign.scheduledDate ?
                        '📅 ' + new Date(campaign.scheduledDate).toLocaleDateString('it-IT') + ' ' + 
                        new Date(campaign.scheduledDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) :
                        'Non programmata'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Performance</p>
                    <p className="font-medium">
                      {campaign.openCount > 0 && campaign.clickCount > 0 ? 
                        `${((campaign.clickCount / campaign.openCount) * 100).toFixed(1)}% CTR` : 
                        'In attesa dati'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Mail className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna campagna email trovata</h3>
              <p className="text-sm text-gray-500">Modifica i criteri di ricerca o crea una nuova campagna.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Nuova Campagna Email</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Campagna
                  </label>
                  <Input 
                    type="text" 
                    placeholder="es. Newsletter Febbraio 2024"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oggetto Email
                  </label>
                  <Input 
                    type="text" 
                    placeholder="es. 🔥 Nuove Collezioni e Sconti Esclusivi!"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Campagna
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="newsletter">Newsletter</option>
                    <option value="promotional">Promozionale</option>
                    <option value="automated">Automatica</option>
                    <option value="welcome">Benvenuto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segmenti Destinatari
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Tutti gli Iscritti (2,847 persone)
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Clienti VIP (234 persone)
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Nuovi Iscritti (156 persone)
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Carrello Abbandonato (423 persone)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Email
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="celio_newsletter_template">Template Newsletter Celio</option>
                    <option value="promotional_template">Template Promozionale</option>
                    <option value="welcome_template">Template Benvenuto</option>
                    <option value="custom_template">Template Personalizzato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenuto Email
                  </label>
                  <textarea 
                    rows={6}
                    placeholder="Scrivi il contenuto della tua email qui..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programmazione
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="schedule" value="immediate" className="mr-2" defaultChecked />
                      Invia Subito
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="schedule" value="scheduled" className="mr-2" />
                      Programma per:
                    </label>
                    <Input type="datetime-local" className="w-auto" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Annulla
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "📧 Email di Test Inviata",
                    description: "Anteprima email inviata al tuo indirizzo per controllo."
                  });
                }}
              >
                Invia Test
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  toast({
                    title: "✅ Campagna Creata",
                    description: "La nuova campagna email è stata creata con successo!"
                  });
                  setShowCreateModal(false);
                }}
              >
                Crea Campagna
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailCampaigns;