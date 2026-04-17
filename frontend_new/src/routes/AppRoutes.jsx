import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing/Landing';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Inventory from '@/pages/Inventory/Inventory';
import Orders from '@/pages/Orders/Orders';
import Sales from '@/pages/Sales/Sales';
import Insights from '@/pages/Insights/Insights';
import Settings from '@/pages/Settings/Settings';
import Agents from '@/pages/Agents/Agents';
import DashboardLayout from '@/components/DashboardLayout';

import VendorDirectory from '@/pages/Vendors/Vendors';
import PricingManagement from '@/pages/Pricing/Pricing';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/orders" element={<Orders />} />

          <Route path="/vendors" element={<VendorDirectory />} />
          <Route path="/pricing" element={<PricingManagement />} />
          
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/agents" element={<Agents />} />
        </Route>

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
