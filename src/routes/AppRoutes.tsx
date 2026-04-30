import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { IncomePage } from '@/features/income/pages/IncomePage';
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage';
import { FamilyPage } from '@/features/family/pages/FamilyPage';
import { GoalsPage } from '@/features/goalsAndDebts/pages/GoalsPage';
import { EducationPage } from '@/features/education/pages/EducationPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

const protect = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;
const admin = (el: React.ReactNode) => (
  <ProtectedRoute>
    <AdminRoute>{el}</AdminRoute>
  </ProtectedRoute>
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={protect(<DashboardPage />)} />
      <Route path="/income" element={admin(<IncomePage />)} />
      <Route path="/expenses" element={protect(<ExpensesPage />)} />
      <Route path="/family" element={protect(<FamilyPage />)} />
      <Route path="/goals" element={protect(<GoalsPage />)} />
      <Route path="/education" element={protect(<EducationPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
