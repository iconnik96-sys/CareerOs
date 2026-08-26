import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AICopilotDrawer } from '../common/AICopilotDrawer';
import { Sparkles } from 'lucide-react';
export const AppLayout = () => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(false);
    return (<div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)}/>

      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (<div onClick={() => setMobileSidebarOpen(false)} style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 35
            }}/>)}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Navbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} onToggleCopilot={() => setCopilotOpen(prev => !prev)}/>
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Floating Copilot Launch Trigger (Bottom Right when closed) */}
      {!copilotOpen && (<button onClick={() => setCopilotOpen(true)} style={{
                position: 'fixed',
                bottom: '1.75rem',
                right: '1.75rem',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '0.75rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: '0 10px 25px rgba(124, 58, 237, 0.4)',
                cursor: 'pointer',
                zIndex: 90,
                transition: 'all 0.2s ease'
            }} title="Open AI Career Copilot">
          <Sparkles size={16}/> AI Copilot
        </button>)}

      {/* Global AI Copilot Drawer */}
      <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)}/>
    </div>);
};
