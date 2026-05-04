import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  userId?: string | null;
}

export function useSocket({ userId }: UseSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Connect to NestJS WebSocket gateway (make sure port matches your backend URL)
    // You might want to use environment variables for this in production: process.env.NEXT_PUBLIC_API_URL
    const socketInstance = io('http://localhost:3001', {
      query: { userId },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return { socket, isConnected };
}
