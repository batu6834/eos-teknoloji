import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminPanel from './components/AdminComponents/AdminPanel';
import AdminLogin from './components/AdminComponents/AdminLogin';
import Contact from './pages/Contact';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Errors from './pages/Errors';
import Support from './pages/Support';
import Home from './pages/Home';
import About from './pages/About';
import TechnicalService from './pages/TechnicalService';
import BusinessSolutions from './pages/BusinessSolutions';
import ServerStorageSystems from './pages/ServerStorageSystems';
import SmartNetworkTechnologies from './pages/SmartNetworkTechnologies';
import OperationalEquipmentRental from './pages/OperationalEquipmentRental';
import DataAnalyticsAi from './pages/DataAnalyticsAi';
import Partnerships from './pages/PartnerShips';
import CompanyLogin from './pages/CompanyLogin';
import CompanySupportRequest from './pages/CompanySupportRequest';
import PerformancePage from './pages/PerformancePage'; // KPI sayfası (admin için)
import WorkOrderDetail from './components/workorders/WorkOrderDetail';
import SupportDetail from "./pages/SupportDetail";
import AuthCallback from "./pages/AuthCallback";


// ✅ Admin detay
import AdminCompanyDetail from './components/AdminComponents/AdminCompanyDetail';

function Shell() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen">
      {!isAdminPage && <Navbar />}
      <Routes>
        {/* Website tarafı */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<Products />} />
        <Route path="/urun-detay/:id" element={<ProductDetail />} />
        <Route path="/errors" element={<Errors />} />
        <Route path="/support" element={<Support />} />
        <Route path="/services/TechnicalService" element={<TechnicalService />} />
        <Route path="/services/BusinessSolutions" element={<BusinessSolutions />} />
        <Route path="/services/ServerStorageSystems" element={<ServerStorageSystems />} />
        <Route path="/services/SmartNetworkTechnologies" element={<SmartNetworkTechnologies />} />
        <Route path="/services/OperationalEquipmentRental" element={<OperationalEquipmentRental />} />
        <Route path="/services/DataAnalyticsAi" element={<DataAnalyticsAi />} />
        <Route path="/PartnerShips" element={<Partnerships />} />
        <Route path="/login" element={<CompanyLogin />} />
        <Route path="/destek-talebi-olustur" element={<CompanySupportRequest />} />
        <Route path="/admin/work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/:id" element={<SupportDetail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />


        {/* Admin tarafı */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/company/:id"
          element={
            <ProtectedAdminRoute>
              <AdminCompanyDetail />
            </ProtectedAdminRoute>
          }
        />
        {/* 🔹 Admin KPI Performans Sayfası */}
        <Route
          path="/admin/performance"
          element={
            <ProtectedAdminRoute>
              <PerformancePage />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
      {!isAdminPage && <Footer />}
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </Router>
  );
}
