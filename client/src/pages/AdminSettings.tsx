import React, { useState, useEffect } from 'react';
import { Settings, Key, Database, Mail, CreditCard, Cloud, Save, Eye, EyeOff, CheckCircle, AlertTriangle, Activity, BarChart3, Shield, Users, UserPlus, Trash2, Edit, Euro, Truck, Package, FileText, Globe, Clock, Calculator } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ConfigSection {
  title: string;
  description: string;
  fields: ConfigField[];
  status?: 'connected' | 'error' | 'not-configured';
}

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'url';
  value: string;
  placeholder?: string;
  required?: boolean;
  sensitive?: boolean;
}

interface TeamMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  department?: string;
  position?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
}

// Financial Settings Section
const FinancialSettingsSection: React.FC = () => {
  const { toast } = useToast();
  const [financialSettings, setFinancialSettings] = useState({
    defaultCurrency: 'EUR',
    vatRate: '22',
    vatNumber: 'IT12345678901',
    paymentTermsNet: '30',
    accountingPeriod: 'monthly',
    fiscalYearStart: '01-01',
    invoicePrefix: 'CEL',
    invoiceStartNumber: '1000',
    enableMultiCurrency: false,
    exchangeRateProvider: 'ECB'
  });

  const updateFinancialSetting = (key: string, value: string | boolean) => {
    setFinancialSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveFinancialSettings = async () => {
    try {
      // Mock save functionality
      toast({
        title: "✅ Impostazioni Finanziarie Salvate",
        description: "Le configurazioni contabili sono state aggiornate con successo"
      });
    } catch (error) {
      console.error('Error saving financial settings:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Euro className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Impostazioni Finanziarie</h2>
              <p className="text-sm text-gray-600">Configura IVA, contabilità e parametri fiscali per l'Italia</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="h-4 w-4" />
            Configurato
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Valuta Predefinita</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              value={financialSettings.defaultCurrency}
              onChange={(e) => updateFinancialSetting('defaultCurrency', e.target.value)}
            >
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollaro USA (USD)</option>
              <option value="GBP">Sterlina Britannica (GBP)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aliquota IVA Predefinita (%)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              value={financialSettings.vatRate}
              onChange={(e) => updateFinancialSetting('vatRate', e.target.value)}
            >
              <option value="4">4% - Beni di prima necessità</option>
              <option value="10">10% - Prodotti alimentari trasformati</option>
              <option value="22">22% - Aliquota ordinaria</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Partita IVA</label>
            <Input
              placeholder="IT12345678901"
              value={financialSettings.vatNumber}
              onChange={(e) => updateFinancialSetting('vatNumber', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Termini di Pagamento (giorni)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              value={financialSettings.paymentTermsNet}
              onChange={(e) => updateFinancialSetting('paymentTermsNet', e.target.value)}
            >
              <option value="15">Net 15 - 15 giorni</option>
              <option value="30">Net 30 - 30 giorni</option>
              <option value="60">Net 60 - 60 giorni</option>
              <option value="90">Net 90 - 90 giorni</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Periodo Contabile</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              value={financialSettings.accountingPeriod}
              onChange={(e) => updateFinancialSetting('accountingPeriod', e.target.value)}
            >
              <option value="monthly">Mensile</option>
              <option value="quarterly">Trimestrale</option>
              <option value="yearly">Annuale</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Inizio Anno Fiscale</label>
            <Input
              type="text"
              placeholder="01-01"
              value={financialSettings.fiscalYearStart}
              onChange={(e) => updateFinancialSetting('fiscalYearStart', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prefisso Fatture</label>
            <Input
              placeholder="CEL"
              value={financialSettings.invoicePrefix}
              onChange={(e) => updateFinancialSetting('invoicePrefix', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Numero Iniziale Fatture</label>
            <Input
              type="number"
              placeholder="1000"
              value={financialSettings.invoiceStartNumber}
              onChange={(e) => updateFinancialSetting('invoiceStartNumber', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            onClick={saveFinancialSettings}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salva Impostazioni Finanziarie
          </Button>
        </div>
      </div>
    </div>
  );
};

// Shipping & Logistics Section
const ShippingLogisticsSection: React.FC = () => {
  const { toast } = useToast();
  const [shippingSettings, setShippingSettings] = useState({
    defaultCarrier: 'poste-italiane',
    freeShippingThreshold: '50',
    shippingOriginAddress: 'Via Roma 123, 20121 Milano, MI',
    processingTime: '1-2',
    defaultShippingRate: '5.90',
    expressShippingRate: '12.90',
    enableInternationalShipping: true,
    maxPackageWeight: '30',
    packagingType: 'standard'
  });

  const updateShippingSetting = (key: string, value: string | boolean) => {
    setShippingSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveShippingSettings = async () => {
    try {
      toast({
        title: "✅ Impostazioni Spedizione Salvate",
        description: "Le configurazioni logistiche sono state aggiornate con successo"
      });
    } catch (error) {
      console.error('Error saving shipping settings:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Spedizioni e Logistica</h2>
              <p className="text-sm text-gray-600">Configura Poste Italiane e parametri di spedizione</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-blue-50 border-blue-200 text-blue-700">
            <CheckCircle className="h-4 w-4" />
            Poste Italiane
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Corriere Predefinito</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={shippingSettings.defaultCarrier}
              onChange={(e) => updateShippingSetting('defaultCarrier', e.target.value)}
            >
              <option value="poste-italiane">Poste Italiane</option>
              <option value="bartolini">BRT Bartolini</option>
              <option value="gls">GLS</option>
              <option value="dhl">DHL</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Soglia Spedizione Gratuita (€)</label>
            <Input
              type="number"
              placeholder="50"
              value={shippingSettings.freeShippingThreshold}
              onChange={(e) => updateShippingSetting('freeShippingThreshold', e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Indirizzo Magazzino di Spedizione</label>
            <Input
              placeholder="Via Roma 123, 20121 Milano, MI"
              value={shippingSettings.shippingOriginAddress}
              onChange={(e) => updateShippingSetting('shippingOriginAddress', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tempo di Elaborazione (giorni)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={shippingSettings.processingTime}
              onChange={(e) => updateShippingSetting('processingTime', e.target.value)}
            >
              <option value="1-2">1-2 giorni lavorativi</option>
              <option value="2-3">2-3 giorni lavorativi</option>
              <option value="3-5">3-5 giorni lavorativi</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tariffa Spedizione Standard (€)</label>
            <Input
              type="number"
              step="0.10"
              placeholder="5.90"
              value={shippingSettings.defaultShippingRate}
              onChange={(e) => updateShippingSetting('defaultShippingRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tariffa Spedizione Express (€)</label>
            <Input
              type="number"
              step="0.10"
              placeholder="12.90"
              value={shippingSettings.expressShippingRate}
              onChange={(e) => updateShippingSetting('expressShippingRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Peso Massimo Pacco (kg)</label>
            <Input
              type="number"
              placeholder="30"
              value={shippingSettings.maxPackageWeight}
              onChange={(e) => updateShippingSetting('maxPackageWeight', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            onClick={saveShippingSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salva Impostazioni Spedizione
          </Button>
        </div>
      </div>
    </div>
  );
};

// Inventory Management Section
const InventoryManagementSection: React.FC = () => {
  const { toast } = useToast();
  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: '10',
    criticalStockThreshold: '3',
    autoReorderEnabled: true,
    reorderQuantity: '50',
    supplierLeadTime: '7',
    stockValuationMethod: 'FIFO',
    enableSerialNumbers: false,
    enableBatchTracking: true,
    warehouseLocations: true
  });

  const updateInventorySetting = (key: string, value: string | boolean) => {
    setInventorySettings(prev => ({ ...prev, [key]: value }));
  };

  const saveInventorySettings = async () => {
    try {
      toast({
        title: "✅ Impostazioni Inventario Salvate",
        description: "Le configurazioni di magazzino sono state aggiornate con successo"
      });
    } catch (error) {
      console.error('Error saving inventory settings:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Gestione Inventario</h2>
              <p className="text-sm text-gray-600">Configura soglie di scorta, riordini automatici e valorizzazione</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-purple-50 border-purple-200 text-purple-700">
            <CheckCircle className="h-4 w-4" />
            FIFO Attivo
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Soglia Scorta Bassa</label>
            <Input
              type="number"
              placeholder="10"
              value={inventorySettings.lowStockThreshold}
              onChange={(e) => updateInventorySetting('lowStockThreshold', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Soglia Scorta Critica</label>
            <Input
              type="number"
              placeholder="3"
              value={inventorySettings.criticalStockThreshold}
              onChange={(e) => updateInventorySetting('criticalStockThreshold', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Quantità Riordino Automatico</label>
            <Input
              type="number"
              placeholder="50"
              value={inventorySettings.reorderQuantity}
              onChange={(e) => updateInventorySetting('reorderQuantity', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Lead Time Fornitori (giorni)</label>
            <Input
              type="number"
              placeholder="7"
              value={inventorySettings.supplierLeadTime}
              onChange={(e) => updateInventorySetting('supplierLeadTime', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Metodo Valorizzazione Scorte</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              value={inventorySettings.stockValuationMethod}
              onChange={(e) => updateInventorySetting('stockValuationMethod', e.target.value)}
            >
              <option value="FIFO">FIFO - First In, First Out</option>
              <option value="LIFO">LIFO - Last In, First Out</option>
              <option value="WAC">WAC - Weighted Average Cost</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Tracciabilità Avanzata</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inventorySettings.enableSerialNumbers}
                  onChange={(e) => updateInventorySetting('enableSerialNumbers', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Numeri Seriali</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inventorySettings.enableBatchTracking}
                  onChange={(e) => updateInventorySetting('enableBatchTracking', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Tracciamento Lotti</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            onClick={saveInventorySettings}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salva Impostazioni Inventario
          </Button>
        </div>
      </div>
    </div>
  );
};

// Compliance & Legal Section
const ComplianceLegalSection: React.FC = () => {
  const { toast } = useToast();
  const [complianceSettings, setComplianceSettings] = useState({
    gdprEnabled: true,
    cookieConsentEnabled: true,
    dataRetentionPeriod: '7',
    privacyPolicyUrl: '/privacy-policy',
    termsServiceUrl: '/terms-service',
    returnPolicyDays: '14',
    warrantyPeriodMonths: '24',
    companyRegistration: 'REA MI-1234567',
    certifications: 'ISO 9001:2015'
  });

  const updateComplianceSetting = (key: string, value: string | boolean) => {
    setComplianceSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveComplianceSettings = async () => {
    try {
      toast({
        title: "✅ Impostazioni Conformità Salvate",
        description: "Le configurazioni legali e di conformità sono state aggiornate"
      });
    } catch (error) {
      console.error('Error saving compliance settings:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Conformità e Aspetti Legali</h2>
              <p className="text-sm text-gray-600">GDPR, privacy policy e conformità normativa italiana</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="h-4 w-4" />
            GDPR Conforme
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Conformità Privacy</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={complianceSettings.gdprEnabled}
                  onChange={(e) => updateComplianceSetting('gdprEnabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Abilita GDPR (Regolamento Europeo Privacy)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={complianceSettings.cookieConsentEnabled}
                  onChange={(e) => updateComplianceSetting('cookieConsentEnabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Consenso Cookie Obbligatorio</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Periodo Conservazione Dati (anni)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
              value={complianceSettings.dataRetentionPeriod}
              onChange={(e) => updateComplianceSetting('dataRetentionPeriod', e.target.value)}
            >
              <option value="3">3 anni</option>
              <option value="5">5 anni</option>
              <option value="7">7 anni</option>
              <option value="10">10 anni</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Periodo Reso (giorni)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
              value={complianceSettings.returnPolicyDays}
              onChange={(e) => updateComplianceSetting('returnPolicyDays', e.target.value)}
            >
              <option value="14">14 giorni (Diritto recesso UE)</option>
              <option value="30">30 giorni</option>
              <option value="60">60 giorni</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Privacy Policy URL</label>
            <Input
              placeholder="/privacy-policy"
              value={complianceSettings.privacyPolicyUrl}
              onChange={(e) => updateComplianceSetting('privacyPolicyUrl', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Termini di Servizio URL</label>
            <Input
              placeholder="/terms-service"
              value={complianceSettings.termsServiceUrl}
              onChange={(e) => updateComplianceSetting('termsServiceUrl', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Numero REA</label>
            <Input
              placeholder="REA MI-1234567"
              value={complianceSettings.companyRegistration}
              onChange={(e) => updateComplianceSetting('companyRegistration', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Certificazioni Aziendali</label>
            <Input
              placeholder="ISO 9001:2015"
              value={complianceSettings.certifications}
              onChange={(e) => updateComplianceSetting('certifications', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            onClick={saveComplianceSettings}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salva Impostazioni Conformità
          </Button>
        </div>
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagementSection: React.FC = () => {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [resending, setResending] = useState<number | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer' as 'admin' | 'manager' | 'editor' | 'viewer',
    department: '',
    position: ''
  });

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/admin/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const inviteTeamMember = async () => {
    try {
      const response = await fetch('/api/admin/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });
      
      if (response.ok) {
        const result = await response.json();
        setTeamMembers([...teamMembers, result.member]);
        setShowInviteForm(false);
        setInviteForm({ email: '', firstName: '', lastName: '', role: 'viewer', department: '', position: '' });
        
        // Check if email was actually sent successfully
        if (result.emailSent !== false) {
          toast({
            title: "✅ Invito inviato con successo!",
            description: `Account creato e email con credenziali inviata a ${inviteForm.email}. Controlla anche la cartella spam.`,
            className: "bg-green-50 text-green-900 border-green-200"
          });
        } else {
          toast({
            title: "⚠️ Account creato ma email non inviata",
            description: `Account creato per ${inviteForm.email}, ma l'email non è stata inviata. Usa il pulsante "Reinvia".`,
            className: "bg-yellow-50 text-yellow-900 border-yellow-200"
          });
        }
        
        // Reload team members to get updated data
        loadTeamMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invito non riuscito');
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast({
        title: "❌ Errore nell'invio",
        description: `Impossibile inviare l'invito a ${inviteForm.email}. ${error.message || 'Riprova.'}`,
        variant: "destructive"
      });
    }
  };

  const removeTeamMember = async (memberId: number) => {
    try {
      const response = await fetch(`/api/admin/team/${memberId}`, { method: 'DELETE' });
      if (response.ok) {
        setTeamMembers(teamMembers.filter(m => m.id !== memberId));
        toast({
          title: "Membro rimosso",
          description: "Il membro è stato rimosso dal team."
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il membro.",
        variant: "destructive"
      });
    }
  };

  const resendInvitation = async (memberId: number) => {
    try {
      setResending(memberId);
      
      const response = await fetch(`/api/admin/team/${memberId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "✅ Invito inviato con successo!",
          description: "Email con nuove credenziali inviata. Controlla la casella spam se necessario.",
          className: "bg-green-50 text-green-900 border-green-200"
        });
        
        // Reload team members to get updated data
        loadTeamMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Errore",
        description: "Impossibile inviare nuovamente l'invito. Riprova.",
        variant: "destructive"
      });
    } finally {
      setResending(null);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      manager: 'bg-blue-100 text-blue-700',
      editor: 'bg-green-100 text-green-700',
      viewer: 'bg-gray-100 text-gray-700'
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-teal-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Gestione Team</h2>
              <p className="text-sm text-gray-600">Controlla l'accesso e i permessi del tuo team ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="h-4 w-4" />
            {teamMembers.length} membri
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Membri del Team</h3>
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-teal-600 hover:bg-teal-700"
            data-testid="button-invite-team-member"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invita Membro
          </Button>
        </div>

        {showInviteForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-4">Invita nuovo membro</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
              <Input
                placeholder="Nome"
                value={inviteForm.firstName}
                onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
              />
              <Input
                placeholder="Cognome"
                value={inviteForm.lastName}
                onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
              />
              <select
                className="px-3 py-2 border border-gray-300 rounded-md"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
              >
                <option value="viewer">Visualizzatore</option>
                <option value="editor">Editor</option>
                <option value="manager">Manager</option>
                <option value="admin">Amministratore</option>
              </select>
              <Input
                placeholder="Dipartimento"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
              />
              <Input
                placeholder="Posizione"
                value={inviteForm.position}
                onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={inviteTeamMember} className="bg-teal-600 hover:bg-teal-700">
                Invia Invito
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                Annulla
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Caricamento membri...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Nessun membro nel team. Inizia invitando qualcuno!</p>
            </div>
          ) : (
            teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-700 font-semibold">
                      {(member.firstName || '').charAt(0)}{(member.lastName || '').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </h4>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.department && (
                      <p className="text-xs text-gray-400">{member.department} • {member.position}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                  {member.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendInvitation(member.id)}
                      disabled={resending === member.id}
                      className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                      data-testid={`button-resend-invitation-${member.id}`}
                    >
                      {resending === member.id ? (
                        <>
                          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Invio...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Reinvia
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTeamMember(member.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-remove-member-${member.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [configurations, setConfigurations] = useState<Record<string, ConfigSection>>({});
  const [customTestEmail, setCustomTestEmail] = useState('beswest4@gmail.com');
  const [customEmailTesting, setCustomEmailTesting] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to load configurations');
      }
      const data = await response.json();
      setConfigurations(data);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le configurazioni",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (sectionKey: string) => {
    try {
      setSaving(true);
      const section = configurations[sectionKey];
      const configData = section.fields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch(`/api/admin/settings/${sectionKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${sectionKey} configuration`);
      }

      toast({
        title: "Successo!",
        description: `Configurazione ${section.title} salvata con successo`,
      });

      // Reload configurations to get updated status
      await loadConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Errore",
        description: `Errore nel salvare la configurazione ${configurations[sectionKey]?.title}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (sectionKey: string) => {
    try {
      const response = await fetch(`/api/admin/settings/${sectionKey}/test`, {
        method: 'POST',
      });

      const result = await response.json();
      
      toast({
        title: result.success ? "Connessione OK" : "Test Fallito",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Errore Test",
        description: "Impossibile testare la connessione",
        variant: "destructive",
      });
    }
  };

  const sendCustomEmailTest = async () => {
    if (!customTestEmail) return;
    
    setCustomEmailTesting(true);
    try {
      const response = await fetch('/api/admin/email/test-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: customTestEmail })
      });

      const result = await response.json();
      
      toast({
        title: result.success ? "✅ Email Test Inviato!" : "❌ Test Email Fallito",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "❌ Errore Test Email",
        description: "Impossibile inviare l'email di test",
        variant: "destructive",
      });
    } finally {
      setCustomEmailTesting(false);
    }
  };

  const updateField = (sectionKey: string, fieldKey: string, value: string) => {
    setConfigurations(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        fields: prev[sectionKey].fields.map(field =>
          field.key === fieldKey ? { ...field, value } : field
        )
      }
    }));
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'Connesso';
      case 'error':
        return 'Errore';
      default:
        return 'Non configurato';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento configurazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Centro Configurazione ERP</h1>
            <p className="text-gray-600">Gestisci tutte le impostazioni aziendali, finanziarie e operative per Celio</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Enhanced ERP Configuration Sections */}
        <FinancialSettingsSection />
        <ShippingLogisticsSection />
        <InventoryManagementSection />
        <ComplianceLegalSection />
        
        {/* Team Management Section - Special handling */}
        <TeamManagementSection />
        
        {Object.entries(configurations).map(([sectionKey, section]) => (
          <div key={sectionKey} className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sectionKey === 'stripe' && <CreditCard className="h-6 w-6 text-blue-600" />}
                  {sectionKey === 'email' && <Mail className="h-6 w-6 text-green-600" />}
                  {sectionKey === 'database' && <Database className="h-6 w-6 text-purple-600" />}
                  {sectionKey === 'monitoring' && <Activity className="h-6 w-6 text-red-600" />}
                  {sectionKey === 'analytics' && <BarChart3 className="h-6 w-6 text-indigo-600" />}
                  {sectionKey === 'security' && <Shield className="h-6 w-6 text-yellow-600" />}
                  {sectionKey === 'storage' && <Cloud className="h-6 w-6 text-orange-600" />}
                  {sectionKey === 'team' && <Users className="h-6 w-6 text-teal-600" />}
                  {!['stripe', 'email', 'database', 'monitoring', 'analytics', 'security', 'storage', 'team'].includes(sectionKey) && <Key className="h-6 w-6 text-gray-600" />}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(section.status)}`}>
                  {getStatusIcon(section.status)}
                  {getStatusText(section.status)}
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Custom Email Test Section */}
              {sectionKey === 'email' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Test Email Personalizzato</h4>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-sm text-blue-700 block mb-1">Email destinatario:</label>
                      <Input
                        type="email"
                        placeholder="inserisci email per test"
                        value={customTestEmail}
                        onChange={(e) => setCustomTestEmail(e.target.value)}
                        className="text-sm"
                        data-testid="input-custom-test-email"
                      />
                    </div>
                    <Button
                      onClick={sendCustomEmailTest}
                      disabled={!customTestEmail || customEmailTesting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-send-custom-test"
                    >
                      {customEmailTesting ? "Invio..." : "Invia Test"}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((field) => {
                  const fieldId = `${sectionKey}-${field.key}`;
                  const isPassword = field.type === 'password';
                  const showPassword = showPasswords[fieldId];
                  
                  return (
                    <div key={field.key} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                        {field.sensitive && <Key className="h-3 w-3 text-gray-400" />}
                      </label>
                      <div className="relative">
                        <Input
                          type={isPassword && !showPassword ? 'password' : 'text'}
                          value={field.value}
                          onChange={(e) => updateField(sectionKey, field.key, e.target.value)}
                          placeholder={field.placeholder || `Inserisci ${field.label.toLowerCase()}`}
                          className={`${isPassword ? 'pr-10' : ''} ${field.required && !field.value ? 'border-red-300' : ''}`}
                          data-testid={`input-${sectionKey}-${field.key}`}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(fieldId)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            data-testid={`toggle-password-${fieldId}`}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      {field.required && !field.value && (
                        <p className="text-xs text-red-600">Campo obbligatorio</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => saveConfiguration(sectionKey)}
                  disabled={saving || section.fields.some(f => f.required && !f.value)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid={`button-save-${sectionKey}`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salva Configurazione'}
                </Button>
                
                {section.status === 'connected' && (
                  <Button
                    variant="outline"
                    onClick={() => testConnection(sectionKey)}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    data-testid={`button-test-${sectionKey}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Testa Connessione
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(configurations).length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna configurazione disponibile</h3>
          <p className="text-gray-500">Le configurazioni verranno caricate automaticamente dal backend.</p>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;