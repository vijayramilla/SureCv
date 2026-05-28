import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'
import DashboardLayout from './pages/DashboardLayout'
import OptimizePage from './pages/OptimizePage'
import ResumeBuilderPage from './pages/ResumeBuilderPage'
import ResultsPage from './pages/ResultsPage'
import ResumesPage from './pages/ResumesPage'
import JobTrackerPage from './pages/JobTrackerPage'
import HistoryPage from './pages/HistoryPage'
import PricingPage from './pages/PricingPage'
import BillingPage from './pages/BillingPage'
import SettingsPage from './pages/SettingsPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />

            {/* Public pages */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Protected dashboard routes */}
            <Route
              path="/optimize"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OptimizePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-builder"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResumeBuilderPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResultsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResumesPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-tracker"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <JobTrackerPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <JobTrackerPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <HistoryPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PricingPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BillingPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Test route - unprotected for development/testing */}
            <Route
              path="/test/optimize"
              element={
                <DashboardLayout>
                  <OptimizePage />
                </DashboardLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
