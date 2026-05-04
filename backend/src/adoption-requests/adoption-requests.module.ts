import { Module } from '@nestjs/common';
import { AdoptionRequestsController } from './adoption-requests.controller';
import { AdoptionRequestsService } from './adoption-requests.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AdoptionRequestsController],
  providers: [AdoptionRequestsService],
  exports: [AdoptionRequestsService],
})
export class AdoptionRequestsModule {}
