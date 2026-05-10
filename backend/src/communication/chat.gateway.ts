import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    
    // Track online status
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)?.add(client.id);

    await this.usersService.updateLastSeen(userId);
    
    // Notify others
    this.server.emit('userStatus', { userId, status: 'online' });
    console.log(`Client connected: ${client.id} (User: ${userId})`);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          const user = await this.usersService.updateLastSeen(userId) as any;
          
          // Notify others with last seen if permitted
          this.server.emit('userStatus', { 
            userId, 
            status: 'offline', 
            lastSeenAt: user?.showLastSeen ? user?.lastSeenAt : null 
          });
        }
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string }
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const canJoin = await this.messagesService.isConversationParticipant(userId, payload.conversationId);
    if (!canJoin) {
      return { event: 'joinDenied', data: payload.conversationId };
    }

    client.join(payload.conversationId);
    
    // When joining, also mark as read if permitted
    const settings = await this.usersService.getPrivacySettings(userId) as any;
    if (settings?.showReadReceipts) {
      await this.messagesService.markConversationAsRead(userId, payload.conversationId);
      // Notify the other person in the conversation
      this.server.to(payload.conversationId).emit('messagesRead', { 
        conversationId: payload.conversationId, 
        userId 
      });
    }

    return { event: 'joined', data: payload.conversationId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string, content: string }
  ) {
    const senderUserId = client.data.userId as string | undefined;
    if (!senderUserId) {
      client.disconnect(true);
      return;
    }

    const message = await this.messagesService.createMessage(
      senderUserId,
      payload.conversationId, 
      payload.content
    );

    this.server.to(payload.conversationId).emit('newMessage', message);
    return message;
  }

  @SubscribeMessage('getUserStatus')
  async handleGetUserStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string }
  ) {
    const isOnline = this.onlineUsers.has(payload.userId);
    const user = await this.usersService.findById(payload.userId) as any;
    
    return {
      userId: payload.userId,
      status: isOnline ? 'online' : 'offline',
      lastSeenAt: (user?.showLastSeen || payload.userId === client.data.userId) ? user?.lastSeenAt : null
    };
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
