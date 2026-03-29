import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.tsx';
import DashboardLayout from './components/DashboardLayout.tsx';
import MarketPulsePage from './pages/MarketPulsePage.tsx';
import NewsPage from './pages/NewsPage.tsx';
import CRMPage from './pages/CRMPage.tsx';
import AnalysisPage from './pages/AnalysisPage.tsx';
import ContentHubPage from './pages/ContentHubPage.tsx';
import SparringPage from './pages/SparringPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/market-pulse" replace />} />
        <Route path="market-pulse" element={<MarketPulsePage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="crm" element={<CRMPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="content-hub" element={<ContentHubPage />} />
        <Route path="sparring" element={<SparringPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
