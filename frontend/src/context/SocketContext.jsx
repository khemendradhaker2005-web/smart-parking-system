import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
const rawApiUrl = import.meta.env.VITE_API_URL;

// Intelligent URL derivation:
// 1. Explicit VITE_SOCKET_URL
// 2. Strip /api from VITE_API_URL
// 3. Fallback to http://localhost:5001 for local development
const SOCKET_URL = (rawSocketUrl && rawSocketUrl.trim())
  ? rawSocketUrl.trim().replace(/\/+$/, '')
  : (rawApiUrl && rawApiUrl.trim()
      ? rawApiUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '')
      : 'http://localhost:5001');

export function SocketProvider({ children }) {
  const { user, portal } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setConnected(true);
      if (user?.id) {
        s.emit('join_user', user.id);
      }
      if (portal === 'staff' || user?.role === 'staff' || user?.role === 'admin') {
        s.emit('join_staff');
      }
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.id, portal, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  return context || { socket: null, connected: false };
}
