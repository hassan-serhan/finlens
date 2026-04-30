import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdDataProvider } from '@/contexts/HouseholdDataContext';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HouseholdDataProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </HouseholdDataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
