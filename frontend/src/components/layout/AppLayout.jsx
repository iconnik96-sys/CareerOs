import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AICopilotDrawer } from '../common/AICopilotDrawer';
import { UpgradeModal } from '../common/UpgradeModal';
import { ReferralModal } from '../common/ReferralModal';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Sparkles } from 'lucide-react';

export const AppLayout = () => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(false);

    const {
        isUpgradeModalOpen,
        upgradeModalReason,
        closeUpgradeModal,
        isReferralModalOpen,
        setIsReferralModalOpen
    } = useSubscription();

    return (
        <div className="app-container">
            {/* Sidebar Navigation */}
            <Sidebar 
                mobileOpen={mobileSidebarOpen} 
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />

            {/* Backdrop for mobile drawer */}
            {mobileSidebarOpen && (
                <div onClick={() => setMobileSidebarOpen(false)} style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    zIndex: 35
                }}/>
            )}

            {/* Main Content Area */}
            <div className="main-content-wrapper">
                <Navbar 
                    onOpenMobileSidebar={() => setMobileSidebarOpen(true)} 
                    onToggleCopilot={() => setCopilotOpen(prev => !prev)}
                />
                <main style={{ flex: 1 }}>
                    <Outlet />
                </main>
            </div>

            {/* Global AI Copilot Drawer (Triggered from Top Navbar) */}
            <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)}/>

            {/* Global Plan Upgrade Intercept Modal */}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={closeUpgradeModal}
                reasonObj={upgradeModalReason}
            />

            {/* Global Referral Modal */}
            <ReferralModal
                isOpen={isReferralModalOpen}
                onClose={() => setIsReferralModalOpen(false)}
            />
        </div>
    );
};

