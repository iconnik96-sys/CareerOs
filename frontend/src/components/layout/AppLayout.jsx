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
    <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

    {/* Backdrop for mobile drawer */}
    {mobileSidebarOpen && (<div onClick={() => setMobileSidebarOpen(false)} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 35
    }} />)}

    {/* Main Content Area */}
    <div className="main-content-wrapper">
      <Navbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} onToggleCopilot={() => setCopilotOpen(prev => !prev)} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>

    {/* Floating Copilot Launch Trigger (Bottom Right when closed) */}
    {!copilotOpen && (<button onClick={() => setCopilotOpen(true)} className="floating-copilot-trigger" title="Open AI Career Copilot">
      <Sparkles size={16} /> AI Copilot
    </button>)}

    {/* Global AI Copilot Drawer */}
    <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
  </div>);
};
