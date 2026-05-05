import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';
import { ConversationsController } from './conversations.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  providers: [ChatGateway, MessagesService],
  controllers: [ConversationsController],
  exports: [MessagesService],
})
export class CommunicationModule {}
