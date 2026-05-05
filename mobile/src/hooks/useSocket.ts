import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/context/AuthContext';

export function useSocket(enabled = true) {
  const { accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const nextSocket = io(API_BASE_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    nextSocket.on('connect', () => setIsConnected(true));
    nextSocket.on('disconnect', () => setIsConnected(false));
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [accessToken, enabled]);

  return { socket, isConnected };
}
