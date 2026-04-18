import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
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

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    // Expected to parse JWT token here. For this demo, using handshake query or falling back
    // const userId = client.handshake.query.userId;
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string }
  ) {
    client.join(payload.conversationId);
    return { event: 'joined', data: payload.conversationId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderUserId: string, conversationId: string, content: string }
  ) {
    const message = await this.messagesService.createMessage(
      payload.senderUserId, 
      payload.conversationId, 
      payload.content
    );

    // Broadcast to everyone in the room (including sender to confirm)
    this.server.to(payload.conversationId).emit('newMessage', message);
    return message;
  }
}
