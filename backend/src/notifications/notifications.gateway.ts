import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust to match your frontend URL in production
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    client.join(userId);
    console.log(`[WebSocket] User ${userId} joined their notification room.`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(userId).emit('new_notification', notification);
  }

  private getUserIdFromClient(client: Socket) {
    const token = this.extractToken(client);
    if (!token) return null;

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-key-for-auth',
      });
      return payload.sub as string;
    } catch {
      return null;
    }
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }

    return null;
  }
}
