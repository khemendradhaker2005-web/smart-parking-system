import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parksmart_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('parksmart_token') || null);
  const [portal, setPortal] = useState(() => localStorage.getItem('parksmart_portal') || null);
  const [primaryVehicle, setPrimaryVehicle] = useState(() => {
    const saved = localStorage.getItem('parksmart_primary_vehicle');
    return saved ? JSON.parse(saved) : null;
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      refreshProfile().catch(() => logout());
    }
  }, [token]);

  const refreshProfile = async () => {
    try {
      const data = await api.getProfile();
      if (data.success) {
        setUser(data.user);
        setVehicles(data.vehicles || []);
        const primary = data.vehicles?.find((v) => v.is_primary) || data.vehicles?.[0] || null;
        setPrimaryVehicle(primary);
        localStorage.setItem('parksmart_user', JSON.stringify(data.user));
        if (primary) {
          localStorage.setItem('parksmart_primary_vehicle', JSON.stringify(primary));
        }
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err.message);
    }
  };

  const login = async (mobile, password, requestedPortal = 'customer') => {
    setLoading(true);
    try {
      const data = await api.login({ mobile, password, portal: requestedPortal });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setPortal(requestedPortal);
        setPrimaryVehicle(data.primaryVehicle);
        setVehicles(data.vehicles || []);

        localStorage.setItem('parksmart_token', data.token);
        localStorage.setItem('parksmart_user', JSON.stringify(data.user));
        localStorage.setItem('parksmart_portal', requestedPortal);
        if (data.primaryVehicle) {
          localStorage.setItem('parksmart_primary_vehicle', JSON.stringify(data.primaryVehicle));
        }
        return { success: true, user: data.user, portal: requestedPortal };
      }
      return { success: false, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (formData) => {
    setLoading(true);
    try {
      const data = await api.registerCustomer(formData);
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setPortal('customer');
        setPrimaryVehicle(data.primaryVehicle);
        setVehicles([data.primaryVehicle]);

        localStorage.setItem('parksmart_token', data.token);
        localStorage.setItem('parksmart_user', JSON.stringify(data.user));
        localStorage.setItem('parksmart_portal', 'customer');
        if (data.primaryVehicle) {
          localStorage.setItem('parksmart_primary_vehicle', JSON.stringify(data.primaryVehicle));
        }
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPortal(null);
    setPrimaryVehicle(null);
    setVehicles([]);
    localStorage.removeItem('parksmart_token');
    localStorage.removeItem('parksmart_user');
    localStorage.removeItem('parksmart_portal');
    localStorage.removeItem('parksmart_primary_vehicle');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        portal,
        role: user?.role || null,
        primaryVehicle,
        vehicles,
        loading,
        login,
        registerCustomer,
        logout,
        refreshProfile,
        setPrimaryVehicle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
