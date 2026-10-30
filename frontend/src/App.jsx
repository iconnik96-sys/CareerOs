import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
// Layout
import { AppLayout } from './components/layout/AppLayout';
// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DemoOne } from './components/ui/demo';
// App Pages
import { DashboardPage } from './pages/DashboardPage';
import { CareerProfilePage } from './pages/CareerProfilePage';
import { AICareerStudioPage } from './pages/AICareerStudioPage';
import { ResumePage } from './pages/ResumePage';
import { ResumeAnalysisPage } from './pages/ResumeAnalysisPage';
import { JobAnalyzerPage } from './pages/JobAnalyzerPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage';
import { InterviewPrepPage } from './pages/InterviewPrepPage';
import { SettingsPage } from './pages/SettingsPage';
import { SimulationsPage } from './pages/SimulationsPage';
import { SimulationWorkspacePage } from './pages/SimulationWorkspacePage';
import { FounderAdminPage } from './pages/FounderAdminPage';
import { CampusDashboard } from './pages/CampusDashboard';
import { AcceptCampusInvitePage } from './pages/AcceptCampusInvitePage';
import { StudentJoinBatchPage } from './pages/StudentJoinBatchPage';
import { PricingPage } from './pages/PricingPage';
import { PlacementArenaPage } from './pages/PlacementArenaPage';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Guard component that requires authenticated session
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <div className="loading-spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }
    // Require real authenticated user
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Role-based guard for Founder / Admin console
const FounderRoute = ({ children }) => {
    const { user, profile, loading } = useAuth();
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <div className="loading-spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    const isFounder = isFounderUser(user, profile);
    if (!isFounder) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

// Role-based guard for Campus / TPO portal
const CampusRoute = ({ children }) => {
    const { user, profile, loading } = useAuth();
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <div className="loading-spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    const isAuthorized = isCampusAdmin(user, profile);
    if (!isAuthorized) {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

export const App = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <SubscriptionProvider>
                            <Router>
                                <Routes>
                                    {/* Public Landing & Auth */}
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    <Route path="/campus/accept-invite" element={<AcceptCampusInvitePage />} />
                                    <Route path="/join/:code" element={<StudentJoinBatchPage />} />
                                    <Route path="/join" element={<StudentJoinBatchPage />} />
                                    <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                                    <Route path="/cosmic-demo" element={<DemoOne />} />

                                    {/* Protected App Routes with AppLayout Shell */}
                                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/pricing" element={<PricingPage />} />
                                        <Route path="/campus" element={<CampusRoute><CampusDashboard /></CampusRoute>} />
                                        <Route path="/campus-dashboard" element={<CampusRoute><CampusDashboard /></CampusRoute>} />
                                        <Route path="/tpo" element={<CampusRoute><CampusDashboard /></CampusRoute>} />
                                        <Route path="/profile" element={<CareerProfilePage />} />
                                        <Route path="/ai-studio" element={<AICareerStudioPage />} />
                                        <Route path="/ai-career-studio" element={<AICareerStudioPage />} />
                                        <Route path="/resume" element={<Navigate to="/ai-studio" replace />} />
                                        <Route path="/resume-analysis" element={<Navigate to="/ai-studio" replace />} />
                                        <Route path="/job-analyzer" element={<JobAnalyzerPage />} />
                                        <Route path="/jobs" element={<JobsPage />} />
                                        <Route path="/jobs/:id" element={<JobDetailsPage />} />
                                        <Route path="/applications" element={<ApplicationsPage />} />
                                        <Route path="/roadmap" element={<CareerRoadmapPage />} />
                                        <Route path="/arena" element={<Navigate to="/dashboard" replace />} />
                                        <Route path="/interview-prep" element={<InterviewPrepPage />} />
                                        <Route path="/simulations" element={<SimulationsPage />} />
                                        <Route path="/simulations/:trackKey" element={<SimulationWorkspacePage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="/admin" element={<FounderRoute><FounderAdminPage /></FounderRoute>} />
                                        <Route path="/founder" element={<FounderRoute><FounderAdminPage /></FounderRoute>} />
                                    </Route>

                                    {/* Fallback */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Router>
                        </SubscriptionProvider>
                    </ToastProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};
export default App;
