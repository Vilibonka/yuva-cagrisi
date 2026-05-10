import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';
import { ConversationsController } from './conversations.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { UserBlocksModule } from '../user-blocks/user-blocks.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [NotificationsModule, AuthModule, UserBlocksModule, UsersModule],
  providers: [ChatGateway, MessagesService],
  controllers: [ConversationsController],
  exports: [MessagesService],
})
export class CommunicationModule {}

