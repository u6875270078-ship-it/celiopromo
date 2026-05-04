import React from 'react';
import AdminNav from '../components/AdminNav';
import CelioFooter from '@/components/CelioFooter';
import AdminAuthGuard from '@/components/AdminAuthGuard';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <AdminNav />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <CelioFooter />
      </div>
    </AdminAuthGuard>
  );
};

export default AdminLayout;