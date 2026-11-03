import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { DemandPrediction } from './pages/DemandPrediction';
import { CountryGrowthPrediction } from './pages/CountryGrowthPrediction';
import { GeographicClustering } from './pages/GeographicClustering';
import { EVCompatibility } from './pages/EVCompatibility';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { DatasetManagement } from './pages/DatasetManagement';
import { ModelPerformance } from './pages/ModelPerformance';
import { ApiDocumentation } from './pages/ApiDocumentation';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<OverviewDashboard />} />
        <Route path="demand" element={<DemandPrediction />} />
        <Route path="growth" element={<CountryGrowthPrediction />} />
        <Route path="clustering" element={<GeographicClustering />} />
        <Route path="compatibility" element={<EVCompatibility />} />
        <Route path="assistant" element={<AIAssistantPage />} />
        <Route path="datasets" element={<DatasetManagement />} />
        <Route path="models" element={<ModelPerformance />} />
        <Route path="api-docs" element={<ApiDocumentation />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
