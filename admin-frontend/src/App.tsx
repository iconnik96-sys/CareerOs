import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService, FounderProfile } from './services/authService';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';
import { AiAnalyticsPage } from './pages/AiAnalyticsPage';
import { RevenuePage } from './pages/RevenuePage';
import { QuotasPage } from './pages/QuotasPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{
  founder: FounderProfile | null;
  isVerifying: boolean;
  children: React.ReactNode;
}> = ({ founder, isVerifying, children }) => {
  if (isVerifying) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-muted)',
          gap: 16
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
          Cryptographically Verifying Founder Privileges...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!founder || !founder.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const [founder, setFounder] = useState<FounderProfile | null>(() => authService.getFounder());
  const [isVerifying, setIsVerifying] = useState(() => !authService.getFounder());

  useEffect(() => {
    const unsub = authService.subscribe((profile) => {
      setFounder(profile);
    });

    authService.verifySession()
      .finally(() => {
        setIsVerifying(false);
      });

    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            founder?.authenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        <Route
          element={
            <ProtectedRoute founder={founder} isVerifying={isVerifying}>
              <AdminLayout founder={founder} />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<OverviewPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/ai-analytics" element={<AiAnalyticsPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/quotas" element={<QuotasPage />} />
          <Route path="/health" element={<SystemHealthPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

