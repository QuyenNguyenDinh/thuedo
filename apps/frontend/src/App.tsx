import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavbarHeader } from './components/NavbarHeader';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { CostumeListPage } from './pages/CostumeListPage';
import { CostumeDetailPage } from './pages/CostumeDetailPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MyRentalsPage } from './pages/MyRentalsPage';
import { RentalDetailPage } from './pages/RentalDetailPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCostumesPage } from './pages/admin/AdminCostumesPage';
import { AdminRentalsPage } from './pages/admin/AdminRentalsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <NavbarHeader />
          <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/costumes" element={<CostumeListPage />} />
              <Route path="/costumes/:id" element={<CostumeDetailPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Customer Protected Routes */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-rentals" element={<MyRentalsPage />} />
              <Route path="/my-rentals/:id" element={<RentalDetailPage />} />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/costumes" element={<AdminCostumesPage />} />
              <Route path="/admin/rentals" element={<AdminRentalsPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

