/**
 * One shared Socket.IO connection for the logged-in user. Components read the
 * socket from context and subscribe to events (ticket:new, ticket:updated,
 * message:new). The socket connects when a user logs in and disconnects on
 * logout, authenticating with the same JWT as the REST API.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

const BASE = import.meta.env.VITE_API_URL || '';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return undefined;

    const s = io(BASE || '/', {
      auth: { token: getToken() },
      // In dev, same origin via Vite proxy; path stays default /socket.io.
    });
    setSocket(s);

    return () => {
      s.close();
      setSocket(null);
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
