import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { CheckCircle2, AlertCircle, Info, Bell, X } from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial notifications for user
  useEffect(() => {
    if (user?.id && user?.role === 'customer') {
      api.getNotifications()
        .then((res) => {
          if (res.success) {
            setNotifications(res.notifications || []);
            const unread = res.notifications.filter((n) => !n.is_read).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [user?.id, user?.role]);

  // Listen to incoming socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      // Add toast
      const id = Date.now() + Math.random();
      const newToast = { id, ...data };
      setToasts((prev) => [newToast, ...prev]);

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6500);

      // Add to notifications list
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAllAsRead = async () => {
    try {
      if (user?.role === 'customer') {
        await api.markNotificationRead('all');
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        dismissToast,
        markAllAsRead,
      }}
    >
      {children}

      {/* Floating Real-time Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 flex items-start gap-3 bg-white text-slate-800 ${
                isSuccess
                  ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                  : isWarning
                  ? 'border-amber-300 ring-2 ring-amber-500/20'
                  : 'border-blue-300 ring-2 ring-blue-500/20'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-700'
                    : isWarning
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isWarning ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 pr-2">
                <h4 className="font-semibold text-sm text-slate-900 leading-tight">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {toast.message}
                </p>
                {toast.metadata?.slotNumber && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                    Slot: {toast.metadata.slotNumber}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
}
