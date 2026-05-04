import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';
import { ConversationsController } from './conversations.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [ChatGateway, MessagesService],
  controllers: [ConversationsController],
  exports: [MessagesService],
})
export class CommunicationModule {}
