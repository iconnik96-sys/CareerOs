import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { FounderProfile } from '../../services/authService';

interface AdminLayoutProps {
  founder: FounderProfile | null;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ founder }) => {
  return (
    <div className="app-container">
      <AdminSidebar founder={founder} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

