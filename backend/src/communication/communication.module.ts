import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';
import { ConversationsController } from './conversations.controller';

@Module({
  providers: [ChatGateway, MessagesService],
  controllers: [ConversationsController],
  exports: [MessagesService],
})
export class CommunicationModule {}
