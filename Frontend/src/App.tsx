import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AuthCallbackPage from './pages/AuthCallbackPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import CarFundPage from './pages/CarFundPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import ProfilePage from './pages/ProfilePage';
import CreateAccountPage from './pages/CreateAccountPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import FleetManagementPage from './pages/FleetManagementPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import IssueReportPage from './pages/IssueReportPage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';
import RepairsPage from './pages/RepairsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import VehiclesPage from './pages/VehiclesPage';
import WelcomePage from './pages/WelcomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        <Route path="/register" element={<CreateAccountPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route
          path="/fleet-invitations/accept"
          element={<AcceptInvitationPage />}
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/new" element={<IssueReportPage />} />
        <Route path="/fleet" element={<FleetManagementPage />} />
        <Route path="/car-fund" element={<CarFundPage />} />
        <Route
          path="/vehicles/:vehicleId/repairs/new"
          element={<RepairsPage />}
        />
        <Route
          path="/vehicles/:vehicleId/reports/new"
          element={<IssueReportPage />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
