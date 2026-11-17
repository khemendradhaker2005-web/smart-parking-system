import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './services/api';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import StaffLogin from './pages/staff/StaffLogin';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ParkingDiscoveryPage from './pages/customer/ParkingDiscoveryPage';
import CustomerBookingsPage from './pages/customer/CustomerBookingsPage';
import CustomerAnalyticsPage from './pages/customer/CustomerAnalyticsPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffEntryExitPage from './pages/staff/StaffEntryExitPage';
import StaffSlotManagementPage from './pages/staff/StaffSlotManagementPage';
import StaffCustomerRecordsPage from './pages/staff/StaffCustomerRecordsPage';
import StaffHistoryPage from './pages/staff/StaffHistoryPage';
import StaffAnalyticsPage from './pages/staff/StaffAnalyticsPage';

function MainApp() {
  const { user, portal } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');
  const [locations, setLocations] = useState([]);

  // Fetch parking locations on mount
  useEffect(() => {
    api.getLocations()
      .then((res) => {
        if (res.success) setLocations(res.locations || []);
      })
      .catch((e) => console.warn('Could not load locations on initial mount:', e.message));
  }, []);

  // Sync tab on login / logout
  useEffect(() => {
    if (user) {
      setCurrentTab('dashboard');
    } else {
      if (['discovery', 'bookings', 'analytics', 'profile', 'entry-exit', 'slots', 'customers', 'history'].includes(currentTab)) {
        setCurrentTab('home');
      }
    }
  }, [user, portal]);

  const isStaff = user && (portal === 'staff' || user.role === 'staff' || user.role === 'admin');
  const isCustomer = user && (portal === 'customer' || user.role === 'customer');

  const renderContent = () => {
    // If not authenticated
    if (!user) {
      if (currentTab === 'customer-login') {
        return (
          <CustomerLogin
            onNavigate={(tab) => setCurrentTab(tab)}
            onSuccess={() => setCurrentTab('dashboard')}
          />
        );
      }
      if (currentTab === 'customer-register') {
        return (
          <CustomerRegister
            onNavigate={(tab) => setCurrentTab(tab)}
            onSuccess={() => setCurrentTab('dashboard')}
          />
        );
      }
      if (currentTab === 'staff-login') {
        return (
          <StaffLogin
            onNavigate={(tab) => setCurrentTab(tab)}
            onSuccess={() => setCurrentTab('dashboard')}
          />
        );
      }
      return (
        <LandingPage
          onNavigate={(tab) => setCurrentTab(tab)}
          locations={locations}
        />
      );
    }

    // Customer Portal Pages
    if (isCustomer) {
      switch (currentTab) {
        case 'discovery':
          return <ParkingDiscoveryPage onBookingComplete={() => setCurrentTab('bookings')} />;
        case 'bookings':
          return <CustomerBookingsPage onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'analytics':
          return <CustomerAnalyticsPage />;
        case 'profile':
          return <CustomerProfilePage />;
        case 'dashboard':
        default:
          return <CustomerDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    // Staff Portal Pages
    if (isStaff) {
      switch (currentTab) {
        case 'entry-exit':
          return <StaffEntryExitPage locations={locations} />;
        case 'slots':
          return <StaffSlotManagementPage locations={locations} />;
        case 'customers':
          return <StaffCustomerRecordsPage />;
        case 'history':
          return <StaffHistoryPage locations={locations} />;
        case 'analytics':
          return <StaffAnalyticsPage locations={locations} />;
        case 'dashboard':
        default:
          return (
            <StaffDashboard
              onNavigate={(tab) => setCurrentTab(tab)}
              locations={locations}
            />
          );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1">{renderContent()}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
