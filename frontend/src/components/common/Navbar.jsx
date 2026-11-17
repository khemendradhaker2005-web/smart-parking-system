import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationBell from './NotificationBell';
import {
  Car,
  Shield,
  User,
  LogOut,
  MapPin,
  Calendar,
  BarChart3,
  Grid3X3,
  Menu,
  X,
  History,
  Users,
  Radio,
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
  const { user, portal, logout } = useAuth();
  const { connected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStaff = portal === 'staff' || user?.role === 'staff' || user?.role === 'admin';
  const isCustomer = portal === 'customer' || user?.role === 'customer';

  const customerNavItems = [
    { id: 'dashboard', label: 'Live Dashboard', icon: Car },
    { id: 'discovery', label: 'Find Parking', icon: MapPin },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'analytics', label: 'My Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile & Vehicles', icon: User },
  ];

  const staffNavItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'entry-exit', label: 'Gate Operations', icon: Car },
    { id: 'slots', label: 'Visual Slot Grid', icon: Grid3X3 },
    { id: 'customers', label: 'Customer Records', icon: Users },
    { id: 'history', label: 'Parking History', icon: History },
    { id: 'analytics', label: 'Ops Analytics', icon: BarChart3 },
  ];

  const navItems = isStaff ? staffNavItems : isCustomer ? customerNavItems : [];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Park<span className="text-brand-600">Smart</span>
                </span>
                <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Intelligent System
                </span>
              </div>
            </button>

            {/* Portal Badge */}
            {user && (
              <span
                className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 ${
                  isStaff
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
              >
                {isStaff ? <Shield className="w-3 h-3 text-purple-600" /> : <User className="w-3 h-3 text-brand-600" />}
                {isStaff ? 'Staff Portal' : 'Customer Portal'}
              </span>
            )}

            {/* Real-time Socket Indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={connected ? 'Real-time Socket.IO Connected' : 'Reconnecting to real-time engine...'}
            >
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {connected ? 'Live' : 'Connecting'}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-brand-50 text-brand-700 border border-brand-200/60 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <NotificationBell />

                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{user.mobile}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('customer-login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-600 hover:text-brand-800 hover:bg-brand-50 transition"
                >
                  Customer Login
                </button>
                <button
                  onClick={() => setCurrentTab('staff-login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Staff Portal
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
