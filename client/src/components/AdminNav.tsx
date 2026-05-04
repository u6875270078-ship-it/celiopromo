'use client';
import React, { useState, useEffect } from 'react';
import { Package, BarChart3, Users, Truck, Settings, Home, LogOut, ShoppingBag, Database, Bell, Image as ImageIcon, Megaphone, Percent, Mail, Gift, FileText, Sparkles, Store } from 'lucide-react';
import { useLocation } from 'wouter';

const AdminNav: React.FC = () => {
  const [, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('Admin');
  const [userType, setUserType] = useState<string>('admin');

  useEffect(() => {
    // Get user info from localStorage
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
      try {
        const authData = JSON.parse(adminAuth);
        setUserRole(authData.role || '');
        setUserName(authData.username || 'Admin');
        setUserType(authData.userType || 'admin');
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('teamERP');
    localStorage.removeItem('teamAuth');
    setLocation('/admin/login');
  };

  // Define all possible navigation items with role permissions
  const allNavItems = [
    { icon: Home, label: 'Torna al sito', href: '/', roles: ['admin', 'manager', 'editor', 'viewer'] },
    { icon: BarChart3, label: 'Dashboard', href: '/admin', roles: ['admin', 'manager', 'editor', 'viewer'] },
    { icon: Package, label: 'Inventario', href: '/admin/inventory', roles: ['admin', 'manager', 'editor', 'viewer'] },
    { icon: Bell, label: 'Notifiche Stock', href: '/admin/notifications', roles: ['admin', 'manager', 'editor'] },
    { icon: ImageIcon, label: 'Immagini', href: '/admin/images', roles: ['admin', 'manager', 'editor'] },
    { icon: ShoppingBag, label: 'Categorie', href: '/admin/categories', roles: ['admin', 'manager', 'editor'] },
    { icon: Users, label: 'Clienti', href: '/admin/customers', roles: ['admin', 'manager', 'viewer'] },
    // REMOVED: { icon: Package, label: 'Ordini', href: '/admin/orders' }, - Gestione Ordini è bloccata per tutti
    { icon: Megaphone, label: 'Marketing', href: '/admin/marketing', roles: ['admin', 'manager'] },
    { icon: Percent, label: 'Codici Sconto', href: '/admin/discounts', roles: ['admin', 'manager'] },
    { icon: Gift, label: 'Promozioni', href: '/admin/promotions', roles: ['admin', 'manager'] },
    { icon: Mail, label: 'Email Marketing', href: '/admin/email-campaigns', roles: ['admin', 'manager'] },
    { icon: Sparkles, label: 'Lookbook & Outfit', href: '/admin/lookbooks', roles: ['admin', 'manager', 'editor'] },
    { icon: Store, label: 'Negozi', href: '/admin/stores', roles: ['admin', 'manager'] },
    { icon: FileText, label: 'Report ERP', href: '/admin/reports', roles: ['admin', 'manager'] },
    { icon: Database, label: 'Database', href: '/admin/database', roles: ['admin'] },
    { icon: Truck, label: 'Fornitori', href: '/admin/suppliers', roles: ['admin', 'manager'] },
    { icon: Settings, label: 'Impostazioni', href: '/admin/settings', roles: ['admin'] }
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    // If user is traditional admin, show all items (except orders which is removed)
    if (userType === 'admin') return true;
    // If user is team member, check role permissions
    if (userType === 'team') return item.roles.includes(userRole);
    return false;
  });

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Amministratore',
      manager: 'Manager', 
      editor: 'Editor',
      viewer: 'Visualizzatore'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <nav className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">
          {userType === 'team' ? 'Team ERP' : 'Admin ERP'}
        </h1>
        <p className="text-gray-400 text-sm">Celio</p>
        {userType === 'team' && userRole && (
          <p className="text-blue-400 text-xs mt-1">
            {getRoleDisplayName(userRole)} - {userName}
          </p>
        )}
      </div>
      <ul className="space-y-2">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <li key={index}>
              <a 
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid={`nav-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <IconComponent size={20} />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
      
      <div className="mt-auto pt-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition-colors w-full text-left"
          data-testid="button-admin-logout"
        >
          <LogOut size={20} />
          Disconnetti
        </button>
      </div>
    </nav>
  );
};

export default AdminNav;