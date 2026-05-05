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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
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
