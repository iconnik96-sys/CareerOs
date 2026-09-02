import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
// Layout
import { AppLayout } from './components/layout/AppLayout';
// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
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
// Guard component that requires authenticated session
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div className="loading-spinner" style={{ width: 36, height: 36 }}/>
      </div>);
    }
    // Require real authenticated user
    if (!user) {
        return <Navigate to="/login" replace/>;
    }
    return <>{children}</>;
};
export const App = () => {
    return (<AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<LandingPage />}/>
            <Route path="/login" element={<LoginPage />}/>
            <Route path="/register" element={<RegisterPage />}/>
            <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
            <Route path="/onboarding" element={<OnboardingPage />}/>

            {/* Protected App Routes with AppLayout Shell */}
            <Route element={<ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />}/>
              <Route path="/profile" element={<CareerProfilePage />}/>
              <Route path="/ai-studio" element={<AICareerStudioPage />}/>
              <Route path="/resume" element={<ResumePage />}/>
              <Route path="/resume-analysis" element={<ResumeAnalysisPage />}/>
              <Route path="/job-analyzer" element={<JobAnalyzerPage />}/>
              <Route path="/jobs" element={<JobsPage />}/>
              <Route path="/jobs/:id" element={<JobDetailsPage />}/>
              <Route path="/applications" element={<ApplicationsPage />}/>
              <Route path="/roadmap" element={<CareerRoadmapPage />}/>
              <Route path="/interview-prep" element={<InterviewPrepPage />}/>
              <Route path="/settings" element={<SettingsPage />}/>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace/>}/>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>);
};
export default App;
